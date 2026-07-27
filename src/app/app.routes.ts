import { Routes } from '@angular/router';
import { HomePage } from './core/pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: '',
    loadChildren: () => import('./features/identity/identity.routes').then((m) => m.IDENTITY_ROUTES),
  },
  {
    path: '',
    loadChildren: () => import('./features/assets/assets.routes').then((m) => m.ASSETS_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
