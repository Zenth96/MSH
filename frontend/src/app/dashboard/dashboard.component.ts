import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUpload, lucideArrowRight } from '@ng-icons/lucide';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { RecentModelCardComponent } from './components/recent-model-card/recent-model-card.component';
import { UploadButtonComponent } from './components/upload-button/upload-button.component';

interface MockModel {
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
    StatsCardComponent,
    RecentModelCardComponent,
    UploadButtonComponent,
  ],
  viewProviders: [provideIcons({ lucideUpload, lucideArrowRight })],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);

  userName = signal('');
  stats = signal([
    { label: 'Projects', value: '5', icon: 'folder', color: 'text-blue-500' },
    { label: 'Models', value: '6', icon: 'box', color: 'text-violet-500' },
    { label: 'Storage Used', value: '65.6 MB', icon: 'harddrive', color: 'text-emerald-500' },
  ]);

  recentModels = signal<MockModel[]>([
    { id: '1', name: 'Modern House', projectName: 'Archviz Villa', format: 'GLB', fileSize: '4.5 MB', status: 'READY' },
    { id: '2', name: 'Car Model', projectName: 'Game Props Pack', format: 'GLB', fileSize: '12 MB', status: 'PROCESSING' },
    { id: '3', name: 'Furniture Set', projectName: 'Product Showcase', format: 'GLTF', fileSize: '8.2 MB', status: 'READY' },
    { id: '4', name: 'Character Mesh', projectName: 'Interior Design', format: 'FBX', fileSize: '15.8 MB', status: 'ERROR' },
    { id: '5', name: 'Product Render', projectName: 'Archviz Villa', format: 'GLB', fileSize: '3.1 MB', status: 'READY' },
    { id: '6', name: 'City Block', projectName: 'Urban Landscape', format: 'GLB', fileSize: '22 MB', status: 'READY' },
  ]);

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      this.userName.set(user?.name?.split(' ')[0] ?? 'User');
    });
  }
}
