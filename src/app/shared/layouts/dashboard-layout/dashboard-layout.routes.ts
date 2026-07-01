import { Routes } from '@angular/router';
import { AdminGuard } from '../../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-layout.component'),
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'panel-de-control',
        pathMatch: 'full',
      },
      {
        path: 'panel-de-control',
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
        path: '**',
        redirectTo: 'panel-de-control',
      }
    ]
  }
];