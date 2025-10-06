import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./shared/layouts/public-layout/public-layout.routes').then(r => r.routes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/pages/auth.routes').then(r => r.authRoutes),
  },
  {
    path: 'panel',
    loadChildren: () => import('./features/userpanel/userpanel.routes').then(r => r.userPanelRoutes),
  },
  {
    path: 'admin',
    loadChildren: () => import('./shared/layouts/dashboard-layout/dashboard-layout.routes').then(r => r.default),
  },
  {
    path: '**',
    redirectTo: '',
  },
];