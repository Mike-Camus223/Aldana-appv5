import { Routes } from '@angular/router';
import { AdminGuard } from '../../../core/guards/admin.guard';

export default [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard-layout.component'),
    canActivate: [AdminGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('../../../features/dashboard/pages/dashhome/dashhome.component').then(c => c.DashhomeComponent),
      },
      {
        path: 'storage',
        loadComponent: () => import('../../../features/dashboard/pages/product-storage/product-storage.component').then(c => c.ProductStorageComponent),
      },
      {
        path: 'creation',
        loadComponent: () => import('../../../features/dashboard/pages/creation-sec/creation-sec.component').then(c => c.CreationSecComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('../../../features/dashboard/pages/users-management/users-management.component').then(c => c.UsersManagementComponent),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'home',
      }
    ]
  }
] as Routes;
