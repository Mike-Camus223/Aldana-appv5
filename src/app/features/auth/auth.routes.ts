import { Routes } from '@angular/router';
import { RedirectGuard } from '../../core/auth/redirect.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'iniciar-sesion',
        pathMatch: 'full'
      },
      {
        path: 'iniciar-sesion',
        loadComponent: () => import('./pages/login/login-page.component').then(c => c.LoginPageComponent),
        canActivate: [RedirectGuard]
      },
      {
        path: 'registro',
        loadComponent: () => import('./pages/register/register-page.component').then(c => c.RegisterPageComponent),
        canActivate: [RedirectGuard]
      },
      {
        path: '**',
        loadComponent: () => import('./pages/auth-error/404auth.component').then(c => c.Auth404Component)
      }
    ]
  }
];