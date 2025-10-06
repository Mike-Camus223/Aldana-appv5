import { Routes } from '@angular/router';
import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

export const routes: Routes = [
  {
    path: '',
    canActivate: [() => {
      const platformId = inject(PLATFORM_ID);
      if (isPlatformServer(platformId)) {
        return false; // Bloquea la activación de esta ruta en SSR
      }
      return true;
    }],
    loadChildren: () => import('./shared/layouts/public-layout/public-layout.routes').then(r => r.routes),
  },
  {
    path: '',
    canActivate: [() => {
      const platformId = inject(PLATFORM_ID);
      if (isPlatformServer(platformId)) {
        return true; // Solo activa esta ruta en SSR
      }
      return false;
    }],
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login-page/login-page.component').then(c => c.default),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register-page/register-page.component').then(c => c.default),
  },
  {
    path: 'register-confirm',
    loadComponent: () => import('./features/auth/pages/register-confirm/register-confirm.component').then(c => c.default),
  },
  {
    path: 'register-success',
    loadComponent: () => import('./features/auth/pages/register-success/register-success.component').then(c => c.default),
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