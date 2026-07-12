import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import type { Project, CreateProjectDto, UpdateProjectDto } from './project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private api = inject(ApiService);

  getAll(): Observable<Project[]> {
    return this.api.get<Project[]>('/projects');
  }

  getOne(id: string): Observable<Project> {
    return this.api.get<Project>(`/projects/${id}`);
  }

  create(dto: CreateProjectDto): Observable<Project> {
    return this.api.post<Project>('/projects', dto);
  }

  update(id: string, dto: UpdateProjectDto): Observable<Project> {
    return this.api.patch<Project>(`/projects/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/projects/${id}`);
  }
}
