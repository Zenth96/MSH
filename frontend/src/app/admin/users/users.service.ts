import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import type { User } from '../../core/services/auth.service';

@Injectable()
export class UsersService {
  private api = inject(ApiService);

  getAll(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  updateRole(id: string, role: User['role']): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, { role });
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
