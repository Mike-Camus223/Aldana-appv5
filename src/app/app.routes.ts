import { Routes } from '@angular/router';
import { RedirectGuard } from './core/guards/redirect.guard';
import { ConfirmationGuard } from './core/guards/confirmation.guard';

export const routes: Routes = [
  {
    path: 'cuenta',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((r) => r.AUTH_ROUTES),
  },
  {
    path: 'panel',
    loadChildren: () =>
      import('./features/userpanel/userpanel.routes').then(
        (r) => r.userPanelRoutes
      ),
  },
  {
    path: 'checkout',
    loadChildren: () =>
      import('./features/checkout/checkout.routes').then(
        (m) => m.checkoutRoutes
      ),
  },
  {
    path: 'confirmar-registro',
    loadComponent: () =>
      import(
        './features/auth/pages/register-confirm/register-confirm.component'
      ).then((c) => c.RegisterConfirmComponent),
    canActivate: [RedirectGuard, ConfirmationGuard],
  },
  {
    path: 'registro-exitoso',
    loadComponent: () =>
      import(
        './features/auth/pages/register-success/register-success.component'
      ).then((c) => c.RegisterSuccessComponent),
    canActivate: [RedirectGuard, ConfirmationGuard],
  },
  {
    path: '',
    loadChildren: () =>
      import('./shared/layouts/public-layout/public-layout.routes').then(
        (r) => r.PUBLIC_ROUTES
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
