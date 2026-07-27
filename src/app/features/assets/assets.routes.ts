import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth/auth.guard';
import { roleGuard } from '@core/guards/role/role.guard';

export const ASSETS_ROUTES: Routes = [
  {
    path: 'catalog',
    loadComponent: () => import('./asset/pages/browse/browse').then((m) => m.BrowseAssetsPage),
  },
  {
    // Must come before 'catalog/:id' - route matching is order-sensitive and ':id' would
    // otherwise greedily match the literal segment 'new'.
    path: 'catalog/new',
    canActivate: [authGuard],
    loadComponent: () => import('./asset/pages/create/create').then((m) => m.CreateAssetPage),
  },
  {
    path: 'catalog/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./asset/pages/detail/detail').then((m) => m.AssetDetailPage),
  },
  {
    path: 'admin/categories',
    canActivate: [authGuard, roleGuard('Admin')],
    loadComponent: () =>
      import('./category/pages/admin/admin-categories').then((m) => m.AdminCategoriesPage),
  },
  {
    path: 'admin/review',
    canActivate: [authGuard, roleGuard('Admin')],
    loadComponent: () =>
      import('./asset/pages/admin-review/admin-review').then((m) => m.AdminReviewAssetPage),
  },
];
