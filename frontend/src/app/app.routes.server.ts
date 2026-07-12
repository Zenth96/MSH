import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth/*',
    renderMode: RenderMode.Client,
  },
  {
    path: 'not-authenticated',
    renderMode: RenderMode.Client,
  },
  {
    path: '',
    renderMode: RenderMode.Client,
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'projects',
    renderMode: RenderMode.Client,
  },
  {
    path: 'models',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'admin/*',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
