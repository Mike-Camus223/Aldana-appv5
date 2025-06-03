import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./public-layout.component'),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () => import('../../../features/landing/pages/home/home.component').then(c => c.HomeComponent),
      },
      {
        path: 'gallery',
        loadComponent: () => import('../../../features/landing/pages/gallery/gallery.component').then(c => c.GalleryComponent),
      }
    ]
  }
] as Routes;
