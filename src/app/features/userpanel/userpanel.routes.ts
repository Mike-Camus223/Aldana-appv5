import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

export const userPanelRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/userpanel-layout.component').then(m => m.UserpanelLayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'panel-control',
        pathMatch: 'full'
      },
      {
        path: 'panel-control',
        loadComponent: () => import('./pages/dashboard/control-panel.component').then(c => c.ControlPanelComponent),
      },
      {
        path: 'orders-history',
        loadComponent: () => import('./pages/orders-history/orders-history.component').then(c => c.OrdersHistoryComponent),
      },
      {
        path: 'order-details/:id',
        loadComponent: () => import('./pages/order-details/order-details.component').then(c => c.OrderDetailsComponent),
      },
      {
        path: 'informacion-cuenta',
        loadComponent: () => import('./pages/account-profile/account-info.component').then(c => c.AccountInfoComponent),
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./pages/wishlist/whitelist.component').then(c => c.WhitelistComponent),
      },
      {
        path: '**',
        redirectTo: 'panel-control'
      }
    ]
  }
];