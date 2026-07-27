import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Asset ids are dynamic and unbounded - can't enumerate them at build time for prerendering,
  // so this route renders per-request instead (unlike every other route, which is prerendered).
  {
    path: 'catalog/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
