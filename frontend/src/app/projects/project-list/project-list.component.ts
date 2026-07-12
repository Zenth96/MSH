import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideSearch, lucideFolder, lucideBox, lucideArrowRight } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { ProjectService } from '../project.service';
import { projectStatusVariant, extractErrorMessage } from '../project-utils';
import type { Project, ProjectStatus } from '../project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmBadge,
    HlmSpinner,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideSearch, lucideFolder, lucideBox, lucideArrowRight })],
  templateUrl: './project-list.component.html',
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);

  projects = signal<Project[]>([]);
  loading = signal(true);
  error = signal('');
  searchQuery = signal('');
  statusFilter = signal<ProjectStatus | 'ALL'>('ALL');

  readonly filterOptions: { label: string; value: ProjectStatus | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  filteredProjects = computed(() => {
    let result = this.projects();
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    if (query) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
      );
    }

    if (status !== 'ALL') {
      result = result.filter(p => p.status === status);
    }

    return result;
  });

  protected readonly statusVariant = projectStatusVariant;

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Failed to load projects'));
        this.loading.set(false);
      },
    });
  }
}
