import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUpload, lucideArrowRight, lucideFolder, lucideBox, lucideHardDrive, lucideAlertCircle } from '@ng-icons/lucide';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { RecentModelCardComponent } from './components/recent-model-card/recent-model-card.component';
import { UploadButtonComponent } from './components/upload-button/upload-button.component';
import { formatFileSize } from '../projects/project-utils';
import { forkJoin } from 'rxjs';

interface DashboardModel {
  id: string;
  name: string;
  projectName: string;
  format: string;
  fileSize: string;
  status: 'READY' | 'PROCESSING' | 'ERROR';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIcon,
    HlmSpinner,
    StatsCardComponent,
    RecentModelCardComponent,
    UploadButtonComponent,
  ],
  viewProviders: [provideIcons({ lucideUpload, lucideArrowRight, lucideFolder, lucideBox, lucideHardDrive, lucideAlertCircle })],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(ApiService);

  userName = signal('');
  loading = signal(true);
  error = signal('');

  stats = signal([
    { label: 'Projects', value: '—', icon: 'folder', color: 'text-primary' },
    { label: 'Models', value: '—', icon: 'box', color: 'text-violet-500' },
    { label: 'Storage Used', value: '—', icon: 'harddrive', color: 'text-emerald-500' },
  ]);

  recentModels = signal<DashboardModel[]>([]);

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      this.userName.set(user?.name?.split(' ')[0] ?? 'User');
    });

    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      projects: this.api.getProjects(),
      models: this.api.getAllModels(),
    }).subscribe({
      next: (result) => {
        const projects = result.projects || [];
        const models = result.models || [];

        const totalBytes = models.reduce((sum: number, m: any) => sum + (m.fileSize || 0), 0);

        this.stats.set([
          { label: 'Projects', value: String(projects.length), icon: 'folder', color: 'text-primary' },
          { label: 'Models', value: String(models.length), icon: 'box', color: 'text-violet-500' },
          { label: 'Storage Used', value: formatFileSize(totalBytes), icon: 'harddrive', color: 'text-emerald-500' },
        ]);

        const projectMap = new Map<string, string>();
        for (const p of projects) {
          projectMap.set(p.id, p.name);
        }

        const sorted: DashboardModel[] = [...models]
          .filter((m: any) => m.status !== 'UPLOADING')
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8)
          .map((m: any) => ({
            id: m.id,
            name: m.name,
            projectName: projectMap.get(m.projectId) || 'Unknown',
            format: (m.format || '').toUpperCase(),
            fileSize: formatFileSize(m.fileSize || 0),
            status: m.status as 'READY' | 'PROCESSING' | 'ERROR',
          }));

        this.recentModels.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
      },
    });
  }
}
