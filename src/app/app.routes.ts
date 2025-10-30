import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'cuenta',
    loadChildren: () => import('./features/auth/auth.routes').then(r => r.AUTH_ROUTES),
  },
  {
    path: 'panel',
    loadChildren: () => import('./features/userpanel/userpanel.routes').then(r => r.userPanelRoutes),
  },
  {
    path: 'admin',
    loadChildren: () => import('./shared/layouts/dashboard-layout/dashboard-layout.routes').then(r => r.ADMIN_ROUTES),
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