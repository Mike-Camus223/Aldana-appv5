import { Routes } from "@angular/router";


export default [
    {
        path: 'login',
        loadComponent: () => import('./login-page/login-page.component'),
    },
    {
        path: 'register',
        loadComponent: () => import('./register-page/register-page.component'),
    },
    {
        path: 'pre-login',
        loadComponent: () => import('./pre-login/pre-login.component'),
    }
] as Routes;