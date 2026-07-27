import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth/auth.guard';

export const IDENTITY_ROUTES: Routes = [
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/components/register').then((m) => m.RegisterPage),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./auth/verify-email/components/verify-email').then((m) => m.VerifyEmailPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/components/login').then((m) => m.LoginPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/components/forgot-password').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/reset-password/components/reset-password').then(
        (m) => m.ResetPasswordPage,
      ),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./user/pages/account/account').then((m) => m.AccountPage),
  },
];
