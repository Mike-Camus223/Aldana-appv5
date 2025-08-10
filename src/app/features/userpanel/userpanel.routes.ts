import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export default [
  {
    path: 'user-panel',
    loadComponent: () => import('./user-panel.component'),
    canActivate: [AuthGuard]
  },
  {
    path: 'user-panel/historial-ordenes',
    loadComponent: () => import('./pages/order-history/order-history.component'),
    canActivate: [AuthGuard]
  },
  {
    path: 'user-panel/cuenta',
    loadComponent: () => import('./pages/account/account.component'),
    canActivate: [AuthGuard]
  },
  {
    path: 'user-panel/borrar-cuenta',
    loadComponent: () => import('./pages/delete-account/delete-account.component'),
    canActivate: [AuthGuard]
  }
] as Routes;
