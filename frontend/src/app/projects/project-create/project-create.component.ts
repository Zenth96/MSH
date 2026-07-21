import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { ProjectService } from '../project.service';
import { extractErrorMessage } from '../project-utils';

@Component({
  selector: 'app-project-create',
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
  templateUrl: './project-create.component.html',
})
export class ProjectCreateComponent {
  private projectService = inject(ProjectService);
  private router = inject(Router);

  name = signal('');
  description = signal('');
  saving = signal(false);
  error = signal('');

  submit(): void {
    if (!this.name().trim()) {
      this.error.set('Project name is required');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.projectService.create({
      name: this.name().trim(),
      description: this.description().trim() || undefined,
    }).subscribe({
      next: (project) => this.router.navigate(['/app/projects', project.id]),
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Failed to create project'));
        this.saving.set(false);
      },
    });
  }
}
