import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePencil, lucideTrash2, lucideBox, lucideUpload, lucideExternalLink, lucideLoader2 } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import {
  HlmAlertDialog,
  HlmAlertDialogTrigger,
  HlmAlertDialogPortal,
  HlmAlertDialogContent,
  HlmAlertDialogHeader,
  HlmAlertDialogTitle,
  HlmAlertDialogDescription,
  HlmAlertDialogFooter,
  HlmAlertDialogCancel,
  HlmAlertDialogAction,
} from '@spartan-ng/helm/alert-dialog';
import { ProjectService } from '../project.service';
import { ApiService } from '../../core/services/api.service';
import { projectStatusVariant, modelStatusVariant, formatFileSize, extractErrorMessage } from '../project-utils';
import type { Project } from '../project.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIcon,
    HlmButton,
    HlmBadge,
    HlmSpinner,
    HlmSeparator,
    HlmAlertDialog,
    HlmAlertDialogTrigger,
    HlmAlertDialogPortal,
    HlmAlertDialogContent,
    HlmAlertDialogHeader,
    HlmAlertDialogTitle,
    HlmAlertDialogDescription,
    HlmAlertDialogFooter,
    HlmAlertDialogCancel,
    HlmAlertDialogAction,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft, lucidePencil, lucideTrash2, lucideBox, lucideUpload, lucideExternalLink, lucideLoader2 })],
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

  protected readonly statusVariant = projectStatusVariant;
  protected readonly modelStatusVariantFn = modelStatusVariant;
  protected readonly formatSize = formatFileSize;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
    }
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
          this.loadThumbnails(data.models ?? []);
          const stillProcessing = data.models?.some((m) => m.status === 'PROCESSING');
          if (!stillProcessing) {
            this.stopPolling();
          }
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
          if (url) {
            this.thumbnailUrls.update((map) => new Map(map).set(m.id, url));
          }
        },
        error: () => {},
      });
    });
  }

  getThumbnailUrl(modelId: string): string {
    return this.thumbnailUrls().get(modelId) ?? '';
  }

  onDialogClosed(result: unknown): void {
    if (result === 'confirm') {
      this.deleteProject();
    }
  }

  deleteProject(): void {
    const p = this.project();
    if (!p) return;

    this.projectService.delete(p.id).subscribe({
      next: () => this.router.navigate(['/projects']),
      error: (err) => this.error.set(extractErrorMessage(err, 'Failed to delete project')),
    });
  }
}
