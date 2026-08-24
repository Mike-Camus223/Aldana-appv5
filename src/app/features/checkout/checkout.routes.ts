import { Routes } from '@angular/router';
import { demoBlockGuard, demoBlockChildGuard } from '../../core/guards/demo-block.guard';

export const checkoutRoutes: Routes = [
  {
    path: '',
    canActivate: [demoBlockGuard],
    canActivateChild: [demoBlockChildGuard],
    loadComponent: () =>
      import('../../features/landing/pages/cart/cart.component').then(c => c.CartComponent),
    children: [
      {
        path: '',
        redirectTo: 'carrito',
        pathMatch: 'full'
      },
      {
        path: 'carrito',
        canActivate: [demoBlockGuard],
        loadComponent: () =>
          import('./pages/car/car.component').then(c => c.CarComponent),
      },
      {
        path: 'envio',
        canActivate: [demoBlockGuard],
        loadComponent: () =>
          import('./pages/shipping/shipping.component').then(c => c.ShippingComponent),
      },
      {
        path: 'pago',
        canActivate: [demoBlockGuard],
        loadComponent: () =>
          import('./pages/payment/payment.component').then(c => c.PaymentComponent),
      },
      {
        path: 'resultado',
        canActivate: [demoBlockGuard],
        loadComponent: () =>
          import('./pages/result-screen/result-screen.component').then(c => c.ResultScreenComponent),
      },
      {
        path: '**',
        redirectTo: 'carrito'
      }
    ]
  }
];
