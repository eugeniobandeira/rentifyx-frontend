import { Routes } from '@angular/router';
import { HomePage } from './core/pages/home/home';
import { authGuard } from '@core/guards/auth.guard';

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
    path: 'forgot-password',
    loadComponent: () =>
      import('./core/pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./core/pages/reset-password/reset-password').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/identity/user/pages/account/account').then((m) => m.AccountPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
