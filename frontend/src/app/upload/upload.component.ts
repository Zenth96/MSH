import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideUpload, lucideFile, lucideCheck, lucideX, lucideAlertCircle, lucideExternalLink } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { switchMap, filter, timer, takeWhile, tap, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UploadService } from './upload.service';
import type { Model3D } from '../projects/project.model';

/** Elfogadott 3D formátumok. */
const ALLOWED_FORMATS = ['glb', 'gltf', 'obj', 'fbx'];
/** Maximum fájlméret byte-ban (200 MB). */
const MAX_FILE_SIZE = 200 * 1024 * 1024;
/** Polling időköz (ms). */
const POLL_INTERVAL = 2000;
/** Maximum polling próbálkozások (2 perc). */
const MAX_POLL_ATTEMPTS = 60;

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, NgIcon,
    HlmButton, HlmSpinner, HlmBadge,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucideUpload, lucideFile, lucideCheck, lucideX, lucideAlertCircle, lucideExternalLink })],
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  private uploadService = inject(UploadService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /** A kiválasztott fájl. */
  selectedFile = signal<File | null>(null);
  /** A modell neve (pre-fill a fájlnévből). */
  modelName = '';
  /** projectId az URL-ből. */
  projectId = signal<string | null>(this.route.snapshot.queryParamMap.get('projectId'));
  /** Validációs hiba. */
  validationError = signal('');
  /** Feltöltés százalék (0-100). */
  uploadProgress = signal(0);
  /** Fázis: idle | uploading | polling | success | error. */
  phase = signal<'idle' | 'uploading' | 'polling' | 'success' | 'error'>('idle');
  /** Hibaüzenet. */
  errorMessage = signal('');
  /** A feltöltött modell. */
  uploadedModel = signal<Model3D | null>(null);
  /** Polling számláló. */
  pollAttempts = signal(0);
  /** Aktuális upload subscription — cancel-hez. */
  private uploadSubscription: Subscription | null = null;

  /** Fájl formátum (kiterjesztés). */
  get fileExt(): string {
    return this.selectedFile()?.name?.split('.').pop()?.toLowerCase() ?? '';
  }

  /** Fájl méret MB-ban. */
  get fileSizeMB(): string {
    const file = this.selectedFile();
    return file ? (file.size / (1024 * 1024)).toFixed(1) : '0';
  }

  /** Drag over — böngésző alapértelmezett megakadályozása. */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /** Drop — fájl kivétele a drag eventből. */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file) this.validateAndSelect(file);
  }

  /** File input változás — fájl kiválasztás a dialógusból. */
  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) this.validateAndSelect(file);
    input.value = '';
  }

  /**
   * Fájl validálása és kiválasztása.
   * Ellenőrzi a formátumot és a méretet a specifikáció szerint.
   */
  private validateAndSelect(file: File): void {
    this.validationError.set('');
    this.errorMessage.set('');
    this.phase.set('idle');
    this.uploadProgress.set(0);

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
  }

  /** Kiválasztott fájl eltávolítása. */
  clearSelectedFile(): void {
    this.selectedFile.set(null);
    this.modelName = '';
    this.validationError.set('');
    this.phase.set('idle');
    this.uploadProgress.set(0);
    this.errorMessage.set('');
  }

  /**
   * Feltöltés indítása.
   * Flow a specifikáció alapján:
   *   1. Validáció
   *   2. POST /api/models/upload (multipart)
   *   3. Progress bar frissítése UploadProgress eseményekből
   *   4. Response után: polling a modell státuszára
   *   5. READY → success, ERROR → error, timeout → error
   */
  startUpload(): void {
    const file = this.selectedFile();
    const name = this.modelName.trim();
    const projectId = this.projectId();

    if (!file || !name || !projectId) {
      this.errorMessage.set('Please select a file, enter a name, and ensure a project is selected.');
      this.phase.set('error');
      return;
    }

    this.phase.set('uploading');
    this.uploadProgress.set(0);
    this.errorMessage.set('');

    this.uploadSubscription = this.uploadService.upload(file, name, projectId).pipe(
      takeUntilDestroyed(this.destroyRef),
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
        return this.pollStatus(model.id);
      }),
    ).subscribe({
      next: (model: Model3D) => {
        this.uploadedModel.set(model);
        if (model.status === 'READY') this.phase.set('success');
        else if (model.status === 'ERROR') {
          this.phase.set('error');
          this.errorMessage.set('Model processing failed.');
        } else {
          this.phase.set('error');
          this.errorMessage.set('Model processing timed out. Please check back later.');
        }
      },
      error: (err: Error) => {
        this.phase.set('error');
        this.errorMessage.set(err.message || 'Upload failed. Please try again.');
      },
    });
  }

  /**
   * Státusz polling: periodikus lekérdezés amíg READY/ERROR vagy timeout.
   * takeWhile(inclusive: true) — az utolsó (feltételt kilépő) érték is átjön.
   */
  private pollStatus(modelId: string) {
    return timer(0, POLL_INTERVAL).pipe(
      switchMap(() => this.uploadService.getOne(modelId)),
      takeWhile((model: Model3D) => {
        this.pollAttempts.update(n => n + 1);
        const done = model.status === 'READY' || model.status === 'ERROR';
        const timedOut = this.pollAttempts() >= MAX_POLL_ATTEMPTS;
        return !done && !timedOut;
      }, true),
    );
  }

  /** Vissza a project detail-re. */
  navigateBack(): void {
    const pid = this.projectId();
    this.router.navigate(pid ? ['/projects', pid] : ['/projects']);
  }

  /** Upload megszakítása. */
  cancelUpload(): void {
    this.uploadSubscription?.unsubscribe();
    this.uploadSubscription = null;
    this.clearSelectedFile();
  }
}
