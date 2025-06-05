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
        path: 'galeria',
        loadComponent: () => import('../../../features/landing/pages/gallery/gallery.component').then(c => c.GalleryComponent),
      },
      {
        path: 'tienda',
        loadComponent: () => import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'test',
        loadComponent: () => import('../../../shared/components/items-purchase/items-purchase.component').then(c => c.ItemsPurchaseComponent),
      },
      {
        path: 'contacto',
        loadComponent: () => import('../../../features/landing/pages/contact/contact.component').then(c => c.ContactComponent),
      },
      {
        path: 'novias',
        loadComponent: () => import('../../../features/landing/pages/novias/novias.component').then(c => c.NoviasComponent),
      },
      {
        path: 'acerca-de',
        loadComponent: () => import('../../../features/landing/pages/about/about.component').then(c => c.AboutComponent),
      }
    ]
  }
] as Routes;
