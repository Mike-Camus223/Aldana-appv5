import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const userPanelRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-panel.component').then(m => m.UserPanelComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'panel-control',
        loadComponent: () => import('./pages/control-panel/control-panel.component').then(c => c.ControlPanelComponent),
      },
      {
        path: 'orders-history',
        loadComponent: () => import('./pages/orders-history/orders-history.component').then(c => c.OrdersHistoryComponent),
      },
      {
        path: 'order-details/:id',
        loadComponent: () => import('../../shared/components/templates/order-status/order-status.component').then(c => c.OrderStatusComponent),
      },
      {
        path: 'informacion-cuenta',
        loadComponent: () => import('./pages/account-info/account-info.component').then(c => c.AccountInfoComponent),
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./pages/whitelist/whitelist.component').then(c => c.WhitelistComponent),
      },
      {
        path: '',
        redirectTo: 'panel-control',
        pathMatch: 'full'
      },
      {
        path: '**',
        redirectTo: 'panel-control'
      }
    ]
  }
];
