import { Routes } from '@angular/router';
import { resultScreenGuard } from '../../core/guards/result-screen.guard';

export const checkoutRoutes: Routes = [
  {
    path: '',
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
        loadComponent: () =>
          import('./pages/cart-summary/car.component').then(c => c.CarComponent),
      },
      {
        path: 'envio',
        loadComponent: () =>
          import('./pages/shipping-form/shipping.component').then(c => c.ShippingComponent),
      },
      {
        path: 'pago',
        loadComponent: () =>
          import('./pages/payment-process/payment.component').then(c => c.PaymentComponent),
      },
      {
        path: 'resultado',
        canActivate: [resultScreenGuard],
        loadComponent: () =>
          import('./pages/payment-result/result-screen.component').then(c => c.ResultScreenComponent),
      },
      {
        path: '**',
        redirectTo: 'carrito'
      }
    ]
  }
];
