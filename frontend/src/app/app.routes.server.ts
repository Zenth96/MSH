import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '', // landing page
    renderMode: RenderMode.Client,
  },
  {
    path: 'auth/*',
    renderMode: RenderMode.Client,
  },
  {
    path: 'not-authenticated',
    renderMode: RenderMode.Client,
  },
  {
    path: 'app/*',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
