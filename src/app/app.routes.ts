import { Routes } from '@angular/router';
import { HomePage } from './core/pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'register',
    loadComponent: () => import('./core/pages/register/register').then((m) => m.RegisterPage),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./core/pages/verify-email/verify-email').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./core/pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
