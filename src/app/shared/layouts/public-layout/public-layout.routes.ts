import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./public-layout.component').then(c => c.PublicLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('../../../features/landing/pages/home/home.component').then(c => c.HomeComponent),
      },
      {
        path: 'galeria',
        loadComponent: () =>
          import('../../../features/landing/pages/gallery/gallery.component').then(c => c.GalleryComponent),
      },
      {
        path: 'tienda',
        loadComponent: () =>
          import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'producto/:id',
        loadComponent: () =>
          import('../../../shared/components/items-purchase/items-purchase.component').then(m => m.ItemsPurchaseComponent),
      },
      {
        path: 'contacto',
        loadComponent: () =>
          import('../../../features/landing/pages/contact/contact.component').then(c => c.ContactComponent),
      },
      {
        path: 'novias',
        loadComponent: () =>
          import('../../../features/landing/pages/novias/novias.component').then(c => c.NoviasComponent),
      },
      {
        path: 'acerca-de',
        loadComponent: () =>
          import('../../../features/landing/pages/about/about.component').then(c => c.AboutComponent),
      },
      {
        path: 'checkout',
        loadChildren: () =>
          import('../../../features/checkout/checkout.routes').then(m => m.checkoutRoutes),
      },
      {
        path: 'busqueda',
        loadComponent: () => import('../../../features/landing/pages/search-page/search-page.component').then(c => c.SearchPageComponent),
      }
    ]
  }
];
