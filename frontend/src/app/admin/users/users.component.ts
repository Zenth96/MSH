import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderKanban, lucideBox, lucideTrash2 } from '@ng-icons/lucide';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmButton } from '@spartan-ng/helm/button';
import { UsersService } from './users.service';
import type { User } from '../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [HlmTableImports, HlmBadge, HlmSpinner, DatePipe, HlmButton, NgIcon],
  providers: [UsersService, provideIcons({ lucideFolderKanban, lucideBox, lucideTrash2 })],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  users: User[] = [];
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || err.message || 'Hiba a betöltéskor');
        this.loading.set(false);
      },
    });
  }

  roleVariant(role: User['role']): 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' {
    switch (role) {
      case 'ADMIN': return 'default';
      case 'EDITOR': return 'outline';
      case 'VIEWER': return 'ghost';
      default: return 'outline';
    }
  }
}
