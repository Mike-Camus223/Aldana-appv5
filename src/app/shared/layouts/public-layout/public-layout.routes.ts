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
      },
      {
        path: 'store',
        loadComponent: () => import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'test',
        loadComponent: () => import('../../../shared/components/items-purchase/items-purchase.component').then(c => c.ItemsPurchaseComponent),
      }
    ]
  }
] as Routes;
