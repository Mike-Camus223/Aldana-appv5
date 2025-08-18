import { Routes } from '@angular/router';
import { RedirectGuard } from './core/guards/redirect.guard';
import { ConfirmationGuard } from './core/guards/confirmation.guard';

export const routes: Routes = [
    // Auth routes with RedirectGuard at top level
    {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login-page/login-page.component'),
        canActivate: [RedirectGuard]
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/pages/register-page/register-page.component'),
        canActivate: [RedirectGuard]
    },
    {
        path: 'register-confirm',
        loadComponent: () => import('./features/auth/pages/register-confirm/register-confirm.component'),
        canActivate: [ConfirmationGuard]
    },
    {
        path: 'register-success',
        loadComponent: () => import('./features/auth/pages/register-success/register-success.component'),
        canActivate: [ConfirmationGuard]
    },
    {
        path: 'pre-login',
        loadComponent: () => import('./features/auth/pages/pre-login/pre-login.component'),
        canActivate: [RedirectGuard]
    },
    // Other route modules
    {
        path: '',
        loadChildren: () => import('./shared/layouts/public-layout/public-layout.routes').then(r => r.routes),
    },
    {
        path: '',
        loadChildren: () => import('./features/userpanel/userpanel.routes'),
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
