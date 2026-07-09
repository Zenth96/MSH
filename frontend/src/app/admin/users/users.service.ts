import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import type { User } from '../../core/services/auth.service';

@Injectable()
export class UsersService {
  private api = inject(ApiService);

  /** Admin: az összes felhasználó lekérése */
  getAll(): Observable<User[]> {
    return this.api.get<User[]>('/users');
  }

  /** Admin: felhasználó szerepkörének módosítása (#25-höz előkészítve) */
  updateRole(id: string, role: User['role']): Observable<User> {
    return this.api.patch<User>(`/users/${id}`, { role });
  }

  /** Admin: felhasználó törlése (#25-höz előkészítve) */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
