import { Routes } from "@angular/router";
import { ConfirmationGuard } from "../../core/guards/confirmation.guard";
import { RedirectGuard } from "../../core/guards/redirect.guard";

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
        loadComponent: () => import('./pages/register-page/register-page.component').then(c => c.RegisterPageComponent),
        canActivate: [RedirectGuard]
      },
      {
        path: 'confirmar-registro',
        loadComponent: () => import('./pages/register-confirm/register-confirm.component').then(c => c.RegisterConfirmComponent),
         canActivate: [ConfirmationGuard]
      },
      {
        path: 'registro-exitoso',
        loadComponent: () => import('./pages/register-success/register-success.component').then(c => c.RegisterSuccessComponent),
         canActivate: [ConfirmationGuard]
      },
      {
        path: '**',
        redirectTo: 'iniciar-sesion'
      }
    ]
  }
];