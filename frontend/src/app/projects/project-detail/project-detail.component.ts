import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft, lucidePencil, lucideTrash2, lucideBox, lucideUpload,
  lucideExternalLink, lucideLoader2, lucideSearch, lucideX, lucideCheck,
  lucideList, lucideGrid3X3, lucideLayoutGrid, lucideMove, lucideFolderOpen,
  lucideSlidersHorizontal,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { ProjectService } from '../project.service';
import { ApiService } from '../../core/services/api.service';
import { projectStatusVariant, modelStatusVariant, formatFileSize, extractErrorMessage } from '../project-utils';
import type { Project, Model3D, ModelStatus } from '../project.model';

type ModelViewMode = 'list' | 'grid-sm' | 'grid-lg';

const MODEL_STATUSES: { label: string; value: ModelStatus }[] = [
  { label: 'Ready', value: 'READY' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Error', value: 'ERROR' },
];

const MODEL_FORMATS: { label: string; value: string }[] = [
  { label: 'GLB', value: 'glb' },
  { label: 'GLTF', value: 'gltf' },
  { label: 'FBX', value: 'fbx' },
  { label: 'OBJ', value: 'obj' },
];

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmSpinner,
    HlmSeparator,
  ],
  viewProviders: [provideIcons({
    lucideArrowLeft, lucidePencil, lucideTrash2, lucideBox, lucideUpload,
    lucideExternalLink, lucideLoader2, lucideSearch, lucideX, lucideCheck,
    lucideList, lucideGrid3X3, lucideLayoutGrid, lucideMove, lucideFolderOpen,
    lucideSlidersHorizontal,
  })],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  project = signal<Project | null>(null);
  loading = signal(true);
  error = signal('');
  private thumbnailUrls = signal<Map<string, string>>(new Map());
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  viewMode = signal<ModelViewMode>('list');
  searchQuery = signal('');
  statusFilter = signal<Set<ModelStatus>>(new Set());
  formatFilter = signal<Set<string>>(new Set());
  selectedIds = signal<Set<string>>(new Set());
  projects = signal<Project[]>([]);
  showMoveDialog = signal(false);
  showProjectDeleteDialog = signal(false);
  deleteTarget = signal<Model3D | null>(null);
  deleting = signal(false);

  protected readonly statusVariant = projectStatusVariant;
  protected readonly modelStatusVariantFn = modelStatusVariant;
  protected readonly formatSize = formatFileSize;
  protected readonly statuses = MODEL_STATUSES;
  protected readonly formats = MODEL_FORMATS;

  filteredModels = computed(() => {
    let models = this.project()?.models ?? [];
    const query = this.searchQuery().toLowerCase();
    if (query) models = models.filter((m) => m.name.toLowerCase().includes(query));
    const sf = this.statusFilter();
    if (sf.size > 0) models = models.filter((m) => sf.has(m.status));
    const ff = this.formatFilter();
    if (ff.size > 0) models = models.filter((m) => ff.has(m.format));
    return models;
  });

  hasActiveFilter = computed(() => this.searchQuery().length > 0 || this.statusFilter().size > 0 || this.formatFilter().size > 0);

  selectedCount = computed(() => this.selectedIds().size);
  allSelected = computed(() => {
    const models = this.filteredModels();
    return models.length > 0 && this.selectedIds().size === models.length;
  });

  availableTargets = computed(() =>
    this.projects().filter((p) => p.id !== this.project()?.id)
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProject(id);
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.revokeBlobUrls();
  }

  private revokeBlobUrls(): void {
    this.thumbnailUrls().forEach((url) => URL.revokeObjectURL(url));
  }

  loadProject(id: string): void {
    this.loading.set(true);
    this.projectService.getOne(id).subscribe({
      next: (data) => {
        this.project.set(data);
        this.loading.set(false);
        this.loadThumbnails(data.models ?? []);
        this.startPollingIfNeeded(id);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Failed to load project'));
        this.loading.set(false);
      },
    });
  }

  private startPollingIfNeeded(projectId: string): void {
    this.stopPolling();
    const hasProcessing = this.project()?.models?.some((m) => m.status === 'PROCESSING');
    if (!hasProcessing) return;

    this.pollingInterval = setInterval(() => {
      this.projectService.getOne(projectId).subscribe({
        next: (data) => {
          this.project.set(data);
          this.thumbnailUrls.update((map) => {
            const next = new Map(map);
            data.models?.forEach((m) => {
              if (m.thumbnailKey && !next.has(m.id)) {
                this.api.getThumbnailUrl(m.id).subscribe((url) => {
                  if (url) this.thumbnailUrls.update((u) => new Map(u).set(m.id, url));
                });
              }
            });
            return next;
          });
          const stillProcessing = data.models?.some((m) => m.status === 'PROCESSING');
          if (!stillProcessing) this.stopPolling();
        },
        error: () => {},
      });
    }, 3000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private loadThumbnails(models: { id: string; thumbnailKey?: string }[]): void {
    models.filter((m) => m.thumbnailKey).forEach((m) => {
      this.api.getThumbnailUrl(m.id).subscribe({
        next: (url) => {
          if (url) this.thumbnailUrls.update((map) => new Map(map).set(m.id, url));
        },
        error: () => {},
      });
    });
  }

  getThumbnailUrl(modelId: string): string {
    return this.thumbnailUrls().get(modelId) ?? '';
  }

  openProjectDeleteDialog(): void {
    this.showProjectDeleteDialog.set(true);
  }

  cancelProjectDelete(): void {
    this.showProjectDeleteDialog.set(false);
  }

  deleteProject(): void {
    this.showProjectDeleteDialog.set(false);
    const p = this.project();
    if (!p) return;
    this.projectService.delete(p.id).subscribe({
      next: () => this.router.navigate(['/app/projects']),
      error: (err) => this.error.set(extractErrorMessage(err, 'Failed to delete project')),
    });
  }

  toggleStatusFilter(status: ModelStatus): void {
    this.statusFilter.update((set) => {
      const next = new Set(set);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  toggleFormatFilter(format: string): void {
    this.formatFilter.update((set) => {
      const next = new Set(set);
      if (next.has(format)) next.delete(format);
      else next.add(format);
      return next;
    });
  }

  clearAllFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set(new Set());
    this.formatFilter.set(new Set());
  }

  toggleSelect(modelId: string): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) this.selectedIds.set(new Set());
    else this.selectedIds.set(new Set(this.filteredModels().map((m) => m.id)));
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  moveSingleModel(model: Model3D): void {
    this.selectedIds.set(new Set([model.id]));
    this.openMoveDialog();
  }

  openMoveDialog(): void {
    this.api.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.showMoveDialog.set(true);
      },
      error: () => {},
    });
  }

  closeMoveDialog(): void {
    this.showMoveDialog.set(false);
  }

  moveSelectedModels(targetProjectId: string): void {
    const ids = [...this.selectedIds()];
    if (!ids.length || !targetProjectId) return;
    this.deleting.set(true);
    const remaining = [...ids];
    const moveNext = () => {
      if (!remaining.length) {
        this.deleting.set(false);
        this.clearSelection();
        this.showMoveDialog.set(false);
        this.loadProject(this.project()!.id);
        return;
      }
      const id = remaining.shift()!;
      this.api.patch(`/models/${id}`, { projectId: targetProjectId }).subscribe({ next: () => moveNext(), error: () => moveNext() });
    };
    moveNext();
  }

  deleteSelectedModels(): void {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.deleting.set(true);
    const remaining = [...ids];
    const deleteNext = () => {
      if (!remaining.length) {
        this.deleting.set(false);
        this.clearSelection();
        this.loadProject(this.project()!.id);
        return;
      }
      const id = remaining.shift()!;
      this.api.delete(`/models/${id}`).subscribe({ next: () => deleteNext(), error: () => deleteNext() });
    };
    deleteNext();
  }

  confirmDeleteModel(model: Model3D): void {
    this.deleteTarget.set(model);
  }

  clearDeleteTarget(): void {
    this.deleteTarget.set(null);
  }

  deleteModel(modelId: string): void {
    this.deleting.set(true);
    this.api.delete(`/models/${modelId}`).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.loadProject(this.project()!.id);
      },
      error: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
      },
    });
  }
}
