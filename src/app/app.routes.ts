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
    loadComponent: () =>
      import('./features/identity/auth/register/components/register').then(
        (m) => m.RegisterPage,
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/identity/auth/verify-email/components/verify-email').then(
        (m) => m.VerifyEmailPage,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/identity/auth/login/components/login').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/identity/auth/forgot-password/components/forgot-password').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/identity/auth/reset-password/components/reset-password').then(
        (m) => m.ResetPasswordPage,
      ),
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
