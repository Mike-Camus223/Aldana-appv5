import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-layout.component').then(c => c.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../../../features/landing/pages/home/home.component').then(c => c.HomeComponent),
      },
      {
        path: 'colecciones',
        loadComponent: () =>
          import('../../../features/landing/pages/gallery/gallery.component').then(c => c.GalleryComponent),
      },
      {
        path: 'colecciones/:slug',
        loadComponent: () =>
          import('../../../shared/components/templates/generic-collection/generic-collection.component').then(c => c.GenericCollectionComponent),
      },
      {
        path: 'colecciones/:collectionSlug/:itemSlug/:mediaSlug',
        loadComponent: () =>
          import('../../../shared/components/templates/items-collection/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'colecciones/:collectionSlug/:itemSlug',
        loadComponent: () =>
          import('../../../shared/components/templates/items-collection/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'novias-colecciones',
        loadComponent: () => import('../../../features/landing/pages/novias/novias.component').then(c => c.NoviasComponent),
      },
      {
        path: 'novias-colecciones/:collectionSlug/:productSlug/:mediaSlug',
        loadComponent: () =>
          import('../../../shared/components/templates/items-collection/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'novias-colecciones/:collectionSlug/:productSlug',
        loadComponent: () =>
          import('../../../shared/components/templates/items-collection/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'novias-colecciones/:slug',
        loadComponent: () =>
          import('../../../shared/components/templates/generic-collection-brides/generic-collection-brides.component').then(c => c.GenericCollectionBridesComponent),
      },
      {
        path: 'tienda',
        loadComponent: () => import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:categoria',
        loadComponent: () => import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:scope/:categoria',
        loadComponent: () => import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:categoria/subcategoria/:subcategoria',
        loadComponent: () => import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:scope/:categoria/subcategoria/:subcategoria',
        loadComponent: () => import('../../../features/landing/pages/shop/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'producto/:slug',
        loadComponent: () =>
          import('../../../shared/components/templates/items-purchase/items-purchase.component').then(m => m.ItemsPurchaseComponent),
      },
      {
        path: 'contacto',
        loadComponent: () =>
          import('../../../features/landing/pages/contact/contact.component').then(c => c.ContactComponent),
      },
      {
        path: 'acerca-de-mi',
        loadComponent: () =>
          import('../../../features/landing/pages/about/about.component').then(c => c.AboutComponent),
      },
      // {
      //   path: 'checkout',
      //   loadChildren: () =>
      //     import('../../../features/checkout/checkout.routes').then(m => m.checkoutRoutes),
      // },¨
      {
        path: 'journal/:categorySlug/:year/:month/:postSlug',
        loadComponent: () =>
          import('../../components/templates/journal-post/journal-post.component').then(
            (c) => c.JournalPostComponent
          ),
      },
      {
        path: 'journal',
        loadComponent: () =>
          import('../../components/templates/journal/journal.component').then(
            (c) => c.JournalComponent
          ),
      },
      {
        path: 'busqueda',
        loadComponent: () => import('../../../features/landing/pages/search-page/search-page.component').then(c => c.SearchPageComponent),
      },
      {
        path: 'error',
        loadComponent: () => import('../../components/templates/page-not-found/page-not-found.component').then(c => c.PageNotFoundComponent),
      },
      {
        path: '**',
        loadComponent: () => import('../../components/templates/page-not-found/page-not-found.component').then(c => c.PageNotFoundComponent),
      }
    ]
  }
];