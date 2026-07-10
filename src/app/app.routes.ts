import { Routes } from '@angular/router';
import { HomePage } from './core/pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
