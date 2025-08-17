import { Routes } from "@angular/router";
import { RedirectGuard } from "../../../core/guards/redirect.guard";

export default [
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
        path: 'pre-login',
        loadComponent: () => import('./pre-login/pre-login.component'),
        canActivate: [RedirectGuard]
    }
] as Routes;