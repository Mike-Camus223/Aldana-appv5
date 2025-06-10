import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () => import('./shared/layouts/public-layout/public-layout.routes').then(r => r.routes),
    },{
        path: '',
        loadChildren: () => import('./features/auth/pages/auth.routes'),
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
