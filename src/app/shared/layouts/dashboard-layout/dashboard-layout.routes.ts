import { Routes } from '@angular/router';

export default [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard-layout.component'),
    children: [
      {
        path: 'perfil',
        loadComponent: () => import('../../../features/dashboard/pages/dashhome/dashhome.component').then(c => c.DashhomeComponent),
      },
      {
        path: 'control-stock',
        loadComponent: () => import('../../../features/dashboard/pages/product-storage/product-storage.component').then(c => c.ProductStorageComponent),
      },
      {
        path: 'creation-layout',
        loadComponent: () => import('../../../features/dashboard/pages/creation-sec/creation-sec.component').then(c => c.CreationSecComponent),
      },
      {
        path: '',
        redirectTo: 'perfil',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'perfil',
      }
    ]
  }
] as Routes;
