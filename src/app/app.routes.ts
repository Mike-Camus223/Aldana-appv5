import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./features/auth/pages/auth.routes').then(r => r.authRoutes),
    },
    {
        path: '',
        loadChildren: () => import('./shared/layouts/public-layout/public-layout.routes').then(r => r.routes),
    },
    {
        path: '',
        loadChildren: () => import('./features/userpanel/userpanel.routes').then(r => r.userPanelRoutes),
    },
    {
        path: '',
        loadChildren: () => import('./shared/layouts/dashboard-layout/dashboard-layout.routes'),
    },
    {
        path: '**',
        redirectTo: 'home',
    },
];
