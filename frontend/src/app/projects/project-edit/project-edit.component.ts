import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { ProjectService } from '../project.service';
import { extractErrorMessage } from '../project-utils';
import type { ProjectStatus } from '../project.model';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmSpinner,
  ],
  viewProviders: [provideIcons({ lucideArrowLeft })],
  templateUrl: './project-edit.component.html',
})
export class ProjectEditComponent implements OnInit {
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  projectId = '';
  name = signal('');
  description = signal('');
  status = signal<ProjectStatus>('DRAFT');
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    if (this.projectId) {
      this.loadProject();
    }
  }

  loadProject(): void {
    this.projectService.getOne(this.projectId).subscribe({
      next: (project) => {
        this.name.set(project.name);
        this.description.set(project.description || '');
        this.status.set(project.status);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Failed to load project'));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (!this.name().trim()) {
      this.error.set('Project name is required');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.projectService.update(this.projectId, {
      name: this.name().trim(),
      description: this.description().trim() || undefined,
      status: this.status(),
    }).subscribe({
      next: () => this.router.navigate(['/app/projects', this.projectId]),
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Failed to update project'));
        this.saving.set(false);
      },
    });
  }
}
