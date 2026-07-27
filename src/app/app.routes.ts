import { Routes } from '@angular/router';
import { HomePage } from './core/pages/home/home';
import { authGuard } from '@core/guards/auth/auth.guard';
import { roleGuard } from '@core/guards/role/role.guard';

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
    path: 'catalog',
    loadComponent: () =>
      import('./features/assets/asset/pages/browse/browse').then((m) => m.BrowseAssetsPage),
  },
  {
    // Must come before 'catalog/:id' - route matching is order-sensitive and ':id' would
    // otherwise greedily match the literal segment 'new'.
    path: 'catalog/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/assets/asset/pages/create/create').then((m) => m.CreateAssetPage),
  },
  {
    path: 'catalog/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/assets/asset/pages/detail/detail').then((m) => m.AssetDetailPage),
  },
  {
    path: 'admin/categories',
    canActivate: [authGuard, roleGuard('Admin')],
    loadComponent: () =>
      import('./features/assets/category/pages/admin/admin-categories').then(
        (m) => m.AdminCategoriesPage,
      ),
  },
  {
    path: 'admin/review',
    canActivate: [authGuard, roleGuard('Admin')],
    loadComponent: () =>
      import('./features/assets/asset/pages/admin-review/admin-review').then(
        (m) => m.AdminReviewAssetPage,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
