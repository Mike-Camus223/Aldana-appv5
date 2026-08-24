import { Routes } from '@angular/router';
import { demoBlockGuard, demoBlockChildGuard } from './core/guards/demo-block.guard';

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
    canActivate: [demoBlockGuard],
    canActivateChild: [demoBlockChildGuard],
    loadChildren: () =>
      import('./features/checkout/checkout.routes').then(
        (m) => m.checkoutRoutes
      ),
  },
  {
    path: 'confirmar-registro',
    canActivate: [demoBlockGuard],
    loadComponent: () =>
      import(
        './features/auth/pages/register-confirm/register-confirm.component'
      ).then((c) => c.RegisterConfirmComponent),
  },
  {
    path: 'registro-exitoso',
    canActivate: [demoBlockGuard],
    loadComponent: () =>
      import(
        './features/auth/pages/register-success/register-success.component'
      ).then((c) => c.RegisterSuccessComponent),
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
