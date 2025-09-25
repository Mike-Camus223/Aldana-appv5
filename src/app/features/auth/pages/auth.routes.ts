import { Routes } from "@angular/router";
import { RedirectGuard } from "../../../core/guards/redirect.guard";
import { ConfirmationGuard } from "../../../core/guards/confirmation.guard";

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../authPanel.component').then(m => m.AuthPanelComponent),
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login-page/login-page.component'),
        canActivate: [RedirectGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('./register-page/register-page.component'),
        canActivate: [RedirectGuard]
      },
      {
        path: 'register-confirm',
        loadComponent: () => import('./register-confirm/register-confirm.component'),
        canActivate: [RedirectGuard, ConfirmationGuard]
      },
      {
        path: 'register-success',
        loadComponent: () => import('./register-success/register-success.component'),
        canActivate: [RedirectGuard, ConfirmationGuard]
      },
    ]
  }
];

export default authRoutes;