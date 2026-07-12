import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePencil, lucideTrash2, lucideBox, lucideUpload, lucideExternalLink } from '@ng-icons/lucide';
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
  viewProviders: [provideIcons({ lucideArrowLeft, lucidePencil, lucideTrash2, lucideBox, lucideUpload, lucideExternalLink })],
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  project = signal<Project | null>(null);
  loading = signal(true);
  error = signal('');

  protected readonly statusVariant = projectStatusVariant;
  protected readonly modelStatusVariantFn = modelStatusVariant;
  protected readonly formatSize = formatFileSize;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
    }
  }

  loadProject(id: string): void {
    this.loading.set(true);
    this.projectService.getOne(id).subscribe({
      next: (data) => {
        this.project.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Failed to load project'));
        this.loading.set(false);
      },
    });
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
