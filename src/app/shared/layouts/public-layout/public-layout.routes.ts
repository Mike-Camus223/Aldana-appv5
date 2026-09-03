import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./public-layout.component').then(c => c.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../../../features/home/home.component').then(c => c.HomeComponent),
      },
      {
        path: 'pret-a-porter',
        loadComponent: () =>
          import('../../../features/collections/pages/pret-a-porter/pret-gallery/gallery.component').then(c => c.GalleryComponent),
      },
      {
        path: 'pret-a-porter/:slug',
        loadComponent: () =>
          import('../../../features/collections/pages/pret-a-porter/collection-view/generic-collection.component').then(c => c.GenericCollectionComponent),
      },
      {
        path: 'pret-a-porter/:collectionSlug/:itemSlug/:mediaSlug',
        loadComponent: () =>
          import('../../../features/collections/pages/pret-a-porter/item-view/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'pret-a-porter/:collectionSlug/:itemSlug',
        loadComponent: () =>
          import('../../../features/collections/pages/pret-a-porter/item-view/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'novias-colecciones',
        loadComponent: () =>
          import('../../../features/collections/pages/novias/novias-landing/novias.component').then(c => c.NoviasComponent),
      },
      {
        path: 'novias-colecciones/:collectionSlug/:productSlug/:mediaSlug',
        loadComponent: () =>
          import('../../../features/collections/pages/pret-a-porter/item-view/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'novias-colecciones/:collectionSlug/:productSlug',
        loadComponent: () =>
          import('../../../features/collections/pages/pret-a-porter/item-view/items-collection.component').then(c => c.ItemsCollectionComponent),
      },
      {
        path: 'novias-colecciones/:slug',
        loadComponent: () =>
          import('../../../features/collections/pages/novias/novias-collection/generic-collection-brides.component').then(c => c.GenericCollectionBridesComponent),
      },
      {
        path: 'tienda',
        loadComponent: () =>
          import('../../../features/shop/pages/shop-catalog/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:categoria',
        loadComponent: () =>
          import('../../../features/shop/pages/shop-catalog/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:scope/:categoria',
        loadComponent: () =>
          import('../../../features/shop/pages/shop-catalog/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:categoria/subcategoria/:subcategoria',
        loadComponent: () =>
          import('../../../features/shop/pages/shop-catalog/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'tienda/categoria/:scope/:categoria/subcategoria/:subcategoria',
        loadComponent: () =>
          import('../../../features/shop/pages/shop-catalog/shop.component').then(c => c.ShopComponent),
      },
      {
        path: 'producto/:slug',
        loadComponent: () =>
          import('../../../features/shop/pages/product-detail/items-purchase.component').then(m => m.ItemsPurchaseComponent),
      },
      {
        path: 'contacto',
        loadComponent: () =>
          import('../../../features/info/pages/contact/contact.component').then(c => c.ContactComponent),
      },
      {
        path: 'acerca-de-mi',
        loadComponent: () =>
          import('../../../features/info/pages/about-us/about.component').then(c => c.AboutComponent),
      },
      {
        path: 'a-medida',
        loadComponent: () =>
          import('../../../features/info/pages/tailored/tailored.component').then(c => c.TailoredComponent),
      },
      {
        path: 'journal/:categorySlug/:year/:month/:postSlug',
        loadComponent: () =>
          import('../../../features/journal/pages/journal-article/journal-post.component').then(c => c.JournalPostComponent),
      },
      {
        path: 'journal',
        loadComponent: () =>
          import('../../../features/journal/pages/journal-feed/journal.component').then(c => c.JournalComponent),
      },
      {
        path: 'busqueda',
        loadComponent: () =>
          import('../../../features/shop/pages/search-results/search-page.component').then(c => c.SearchPageComponent),
      },
      {
        path: 'error',
        loadComponent: () =>
          import('../../../features/info/pages/not-found/page-not-found.component').then(c => c.PageNotFoundComponent),
      },
      {
        path: '**',
        loadComponent: () =>
          import('../../../features/info/pages/not-found/page-not-found.component').then(c => c.PageNotFoundComponent),
      }
    ]
  }
];