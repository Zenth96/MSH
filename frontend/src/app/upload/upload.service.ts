import { HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api.service';
import type { Model3D } from '../projects/project.model';

/**
 * Modellek API-jának frontend service-e.
 * - upload: fájl feltöltése a POST /models/upload végpontra
 * - getOne: egy modell lekérése ID alapján (polling-hoz)
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private api = inject(ApiService);

  /**
   * 3D modell fájl feltöltése.
   * A FormData tartalmazza a file-t, a nevet és a projectId-t.
   * Az Observable<HttpEvent<Model3D>> események sorozata:
   *   1. HttpUploadProgressEvent (reportProgress)
   *   2. HttpResponse<Model3D> (backend válasza)
   */
  upload(file: File, name: string, projectId: string): Observable<HttpEvent<Model3D>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('projectId', projectId);
    return this.api.uploadWithProgress<Model3D>('/models/upload', formData);
  }

  /**
   * Egy modell lekérése ID alapján — státusz pollinghoz.
   */
  getOne(id: string): Observable<Model3D> {
    return this.api.get<Model3D>(`/models/${id}`);
  }
}
