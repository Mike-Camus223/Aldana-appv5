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
        path: 'historial-ordenes',
        loadComponent: () => import('./pages/orders-history/orders-history.component').then(c => c.OrdersHistoryComponent),
      },
      {
        path: 'informacion-cuenta',
        loadComponent: () => import('./pages/account-info/account-info.component').then(c => c.AccountInfoComponent),
      },
      {
        path: 'cerrar-sesion',
        loadComponent: () => import('./pages/logout/logout.component').then(c => c.LogoutComponent),
      },
      {
        path: 'favoritos',
        loadComponent: () => import('./pages/whitelist/whitelist.component').then(c => c.WhitelistComponent),
      },
      {
        path: 'order-item',
        loadComponent: () => import('../../shared/components/templates/order-status/order-status.component').then(c => c.OrderStatusComponent),
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
