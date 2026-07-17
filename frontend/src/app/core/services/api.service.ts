import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export const API_BASE_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${API_BASE_URL}${path}`, { params });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(`${API_BASE_URL}${path}`, body);
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(`${API_BASE_URL}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${API_BASE_URL}${path}`);
  }

  /**
   * Multipart/form-data fájlfeltöltés progress trackinggel.
   * Az Observable<HttpEvent<T>> eseményeket bocsát ki:
   * - HttpUploadProgressEvent -> upload százalék
   * - HttpResponse<T> -> a szerver válasza
   */
  uploadWithProgress<T>(path: string, formData: FormData): Observable<HttpEvent<T>> {
    const request = new HttpRequest('POST', `${API_BASE_URL}${path}`, formData, {
      reportProgress: true,
      responseType: 'json',
    });
    return this.http.request<T>(request);
  }
}
