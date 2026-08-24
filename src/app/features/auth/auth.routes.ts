import { Routes } from "@angular/router";
import { RedirectGuard } from "../../core/guards/redirect.guard";
import { demoBlockGuard } from "../../core/guards/demo-block.guard";

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./authPanel.component').then(m => m.AuthPanelComponent),
    children: [
      {
        path: '',
        redirectTo: 'iniciar-sesion',
        pathMatch: 'full'
      },
      {
        path: 'iniciar-sesion',
        loadComponent: () => import('./pages/login-page/login-page.component').then(c => c.LoginPageComponent),
        canActivate: [RedirectGuard]
      },
      {
        path: 'registro',
        canActivate: [demoBlockGuard],
        loadComponent: () => import('./pages/register-page/register-page.component').then(c => c.RegisterPageComponent),
      },
      {
        path: '**',
        loadComponent: () => import('./pages/404auth/404auth.component').then(c => c.Auth404Component)
      }
    ]
  }
];