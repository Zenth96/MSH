import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideUpload, lucideFile, lucideCheck, lucideX, lucideAlertCircle, lucideExternalLink, lucidePaperclip, lucideFolderOpen, lucideChevronDown, lucideSearch } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { switchMap, filter, tap, Subscription, Observable } from 'rxjs';
import { UploadService } from './upload.service';
import { ApiService } from '../core/services/api.service';
import type { Model3D, Project } from '../projects/project.model';

const ALLOWED_FORMATS = ['glb', 'gltf', 'obj', 'fbx'];
const MAX_FILE_SIZE = 200 * 1024 * 1024;
const POLL_INTERVAL = 2000;
const MAX_POLL_ATTEMPTS = 300;

function isRequiredRef(uri: string, ext: string): boolean {
  if (ext === 'obj') return uri.endsWith('.mtl');
  return uri.endsWith('.bin') || uri.endsWith('.buf');
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, NgIcon,
    HlmButton, HlmSpinner, HlmBadge,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideUpload, lucideFile, lucideCheck, lucideX, lucideAlertCircle, lucideExternalLink, lucidePaperclip, lucideFolderOpen, lucideChevronDown, lucideSearch })],
  templateUrl: './upload.component.html',
})
export class UploadComponent implements OnInit {
  private uploadService = inject(UploadService);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  modelName = '';
  projectId = signal<string | null>(this.route.snapshot.queryParamMap.get('projectId'));
  projects = signal<Project[]>([]);
  selectedProjectId = signal<string>(this.route.snapshot.queryParamMap.get('projectId') ?? '');
  projectDropdownOpen = signal(false);
  projectSearchQuery = signal('');
  filteredProjects = computed(() => {
    const q = this.projectSearchQuery().toLowerCase();
    return q ? this.projects().filter((p) => p.name.toLowerCase().includes(q)) : this.projects();
  });
  selectedProjectName = computed(() => {
    const pid = this.selectedProjectId();
    if (!pid) return '';
    return this.projects().find((p) => p.id === pid)?.name ?? '';
  });
  validationError = signal('');
  uploadProgress = signal(0);
  phase = signal<'idle' | 'uploading' | 'polling' | 'success' | 'error'>('idle');
  errorMessage = signal('');
  uploadedModel = signal<Model3D | null>(null);
  pollAttempts = signal(0);
  processingElapsed = () => Math.max(0, (this.pollAttempts() - 1) * 2);
  private uploadSubscription: Subscription | null = null;

  externalRefs = signal<string[]>([]);
  refFiles = signal<Map<string, File>>(new Map());

  ngOnInit(): void {
    this.api.getProjects().subscribe({
      next: (projects) => this.projects.set(projects),
      error: () => {},
    });
  }

  selectProject(id: string): void {
    this.selectedProjectId.set(id);
    this.projectDropdownOpen.set(false);
    this.projectSearchQuery.set('');
  }

  get fileExt(): string {
    return this.selectedFile()?.name?.split('.').pop()?.toLowerCase() ?? '';
  }

  get fileSizeMB(): string {
    const file = this.selectedFile();
    return file ? (file.size / (1024 * 1024)).toFixed(1) : '0';
  }

  isRequiredRef = (uri: string) => isRequiredRef(uri, this.fileExt);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) this.validateAndSelect(file);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) this.validateAndSelect(file);
    input.value = '';
  }

  private async validateAndSelect(file: File): Promise<void> {
    this.validationError.set('');
    this.errorMessage.set('');
    this.phase.set('idle');
    this.uploadProgress.set(0);
    this.externalRefs.set([]);
    this.refFiles.set(new Map());

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_FORMATS.includes(ext)) {
      this.validationError.set(`Invalid format: .${ext}. Allowed formats: .glb, .gltf, .obj, .fbx`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.validationError.set(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum: 200 MB`);
      return;
    }

    this.selectedFile.set(file);
    this.modelName = file.name.replace(/\.[^/.]+$/, '');

    let refs: string[] = [];
    if (ext === 'gltf') {
      refs = await this.detectGltfRefs(file);
    } else if (ext === 'obj') {
      refs = await this.detectObjRefs(file);
    } else if (ext === 'fbx') {
      refs = await this.detectFbxRefs(file);
    }
    if (refs.length) {
      this.externalRefs.set(refs);
    }
  }

  private async detectGltfRefs(file: File): Promise<string[]> {
    try {
      const text = await file.text();
      const gltf = JSON.parse(text);
      const refs = new Set<string>();
      if (gltf.buffers) for (const b of gltf.buffers) {
        if (b.uri && !b.uri.startsWith('data:') && !b.uri.startsWith('http') && !b.uri.startsWith('blob:')) refs.add(b.uri);
      }
      if (gltf.images) for (const i of gltf.images) {
        if (i.uri && !i.uri.startsWith('data:') && !i.uri.startsWith('http') && !i.uri.startsWith('blob:')) refs.add(i.uri);
      }
      return [...refs];
    } catch {
      return [];
    }
  }

  private async detectObjRefs(file: File): Promise<string[]> {
    try {
      const text = await file.text();
      const refs = new Set<string>();
      const mtlMatch = text.match(/^mtllib\s+(.+)$/im);
      if (mtlMatch) {
        const mtlFile = mtlMatch[1].trim().split(/[\\/]/).pop() || mtlMatch[1].trim();
        refs.add(mtlFile);
      }
      return [...refs];
    } catch {
      return [];
    }
  }

  private async detectFbxRefs(file: File): Promise<string[]> {
    try {
      const buf = await file.arrayBuffer();
      const view = new Uint8Array(buf);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(view);
      const texExts = /\.(png|jpg|jpeg|tga|bmp|tif|tiff|dds)/gi;
      const found = new Set<string>();
      let m;
      while ((m = texExts.exec(text)) !== null) {
        const start = Math.max(0, m.index - 40);
        const segment = text.slice(start, m.index + m[0].length);
        const nameMatch = segment.match(/([^\\\/:\s"]+\.(png|jpg|jpeg|tga|bmp|tif|tiff|dds))/i);
        if (nameMatch) found.add(nameMatch[1]);
      }
      return [...found];
    } catch {
      return [];
    }
  }

  private fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onRefFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) return;

    const refs = this.externalRefs();
    const matched = new Map(this.refFiles());

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (refs.includes(f.name)) {
        matched.set(f.name, f);
      }
    }

    this.refFiles.set(matched);
    input.value = '';
  }

  removeRefFile(name: string): void {
    const m = new Map(this.refFiles());
    m.delete(name);
    this.refFiles.set(m);
  }

  clearSelectedFile(): void {
    this.selectedFile.set(null);
    this.modelName = '';
    this.validationError.set('');
    this.phase.set('idle');
    this.uploadProgress.set(0);
    this.errorMessage.set('');
    this.externalRefs.set([]);
    this.refFiles.set(new Map());
  }

  private async embedGltfRefs(gltfFile: File): Promise<File> {
    const text = await gltfFile.text();
    const gltf = JSON.parse(text);
    const refs = this.refFiles();

    if (gltf.buffers) for (const b of gltf.buffers) {
      if (b.uri && refs.has(b.uri)) {
        b.uri = await this.fileToDataUri(refs.get(b.uri)!);
      }
    }
    if (gltf.images) for (const i of gltf.images) {
      if (i.uri && refs.has(i.uri)) {
        i.uri = await this.fileToDataUri(refs.get(i.uri)!);
      }
    }

    const blob = new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' });
    return new File([blob], gltfFile.name, { type: 'model/gltf+json' });
  }

  async startUpload(): Promise<void> {
    const file = this.selectedFile();
    const name = this.modelName.trim();
    const projectId = this.projectId();

    if (!file || !name || !this.selectedProjectId()) {
      this.errorMessage.set('Please select a file, enter a name, and ensure a project is selected.');
      this.phase.set('error');
      return;
    }

    const ext = this.fileExt;
    const hasMissingRequired = this.externalRefs().some(r => isRequiredRef(r, ext) && !this.refFiles().has(r));
    if (hasMissingRequired) {
      this.errorMessage.set('Missing required external files. Please select them before uploading.');
      this.phase.set('error');
      return;
    }

    this.phase.set('uploading');
    this.uploadProgress.set(0);
    this.errorMessage.set('');

    const refFiles = this.refFiles().size > 0 ? [...this.refFiles().values()] : undefined;
    let uploadFile = file;

    if (ext === 'gltf' && this.refFiles().size > 0) {
      uploadFile = await this.embedGltfRefs(file);
    }

    this.uploadSubscription = this.uploadService.upload(uploadFile, name, this.selectedProjectId(), refFiles).pipe(
      tap((event: HttpEvent<Model3D>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        }
      }),
      filter((event: HttpEvent<Model3D>) => event.type === HttpEventType.Response),
      switchMap((event: HttpEvent<Model3D>) => {
        const model = (event as any).body as Model3D;
        if (!model?.id) throw new Error('Upload succeeded but no model data returned.');
        this.uploadedModel.set(model);
        this.phase.set('polling');
        this.pollAttempts.set(0);
        return this.pollModel(model.id);
      }),
    ).subscribe({
      next: (result: 'ready' | 'error' | 'timeout') => {
        if (result === 'ready') {
          this.phase.set('success');
        } else if (result === 'error') {
          this.phase.set('error');
          this.errorMessage.set('Model processing failed.');
        } else {
          this.phase.set('error');
          this.errorMessage.set('Model processing timed out. Please check back later.');
        }
      },
      error: (_err: Error) => {
        this.phase.set('error');
        this.errorMessage.set('Upload failed. Please try again.');
      },
    });
  }

  private pollModel(modelId: string) {
    return new Observable<'ready' | 'error' | 'timeout'>((observer) => {
      let attempts = 0;
      let destroyed = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let httpSub: Subscription | null = null;

      const poll = () => {
        if (destroyed) return;
        attempts++;
        this.pollAttempts.set(attempts);

        httpSub = this.uploadService.getOne(modelId).subscribe({
          next: (model) => {
            if (destroyed) return;
            this.uploadedModel.set(model);
            if (model.status === 'READY') {
              observer.next('ready');
              observer.complete();
            } else if (model.status === 'ERROR') {
              observer.next('error');
              observer.complete();
            } else if (attempts >= MAX_POLL_ATTEMPTS) {
              observer.next('timeout');
              observer.complete();
            } else {
              timeoutId = setTimeout(poll, POLL_INTERVAL);
            }
          },
          error: () => {
            if (destroyed) return;
            timeoutId = setTimeout(poll, POLL_INTERVAL);
          },
        });
      };

      poll();

      return () => {
        destroyed = true;
        if (timeoutId !== null) clearTimeout(timeoutId);
        httpSub?.unsubscribe();
      };
    });
  }

  navigateBack(): void {
    const pid = this.selectedProjectId() || this.projectId();
    this.router.navigate(pid ? ['/app/projects', pid] : ['/app/projects']);
  }

  cancelUpload(): void {
    this.uploadSubscription?.unsubscribe();
    this.uploadSubscription = null;
    this.clearSelectedFile();
  }
}
