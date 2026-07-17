import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideBox, lucideTrash2, lucideLoader2 } from '@ng-icons/lucide';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmButton } from '@spartan-ng/helm/button';
import { toast } from '@spartan-ng/brain/sonner';
import { UsersService } from './users.service';
import type { User } from '../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [HlmTableImports, HlmSpinner, DatePipe, HlmButton, NgIcon],
  providers: [UsersService, provideIcons({ lucideFolderOpen, lucideBox, lucideTrash2, lucideLoader2 })],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);

  users: User[] = [];
  loading = signal(true);
  error = signal('');
  deleting = signal(false);
  updating = signal<string | null>(null);

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
        this.error.set(err.error?.message || err.message || 'Failed to load users');
        this.loading.set(false);
      },
    });
  }

  onRoleChange(userId: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value as User['role'];
    const user = this.users.find(u => u.id === userId);
    const oldRole = user?.role;
    if (!user || !newRole || newRole === oldRole) return;

    this.updating.set(userId);
    this.usersService.updateRole(userId, newRole).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === userId);
        if (idx > -1) this.users[idx] = updated;
        toast.success('Role updated successfully');
        this.updating.set(null);
      },
      error: (err) => {
        target.value = oldRole!;
        toast.error(err.error?.message || 'Failed to update role');
        this.updating.set(null);
      },
    });
  }

  confirmDelete(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`)) return;
    this.deleting.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        toast.success('User deleted successfully');
        this.deleting.set(false);
      },
      error: (err) => {
        toast.error(err.error?.message || 'Failed to delete user');
        this.deleting.set(false);
      },
    });
  }
}
