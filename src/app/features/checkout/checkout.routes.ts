import { Routes } from '@angular/router';
import { paymentsuccesguardGuard } from '../../core/guards/paymentsuccesguard.guard';

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
          import('./pages/car/car.component').then(c => c.CarComponent),
      },
      {
        path: 'envio',
        loadComponent: () =>
          import('./pages/shipping/shipping.component').then(c => c.ShippingComponent),
      },
      {
        path: 'pago',
        loadComponent: () =>
          import('./pages/payment/payment.component').then(c => c.PaymentComponent),
      },
      {
        path: 'success',
        canActivate: [paymentsuccesguardGuard],
        loadComponent: () =>
          import('../../shared/components/success-pay/success-pay.component').then(c => c.SuccessPayComponent),
      }
    ]
  }
];
