import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, take, of, catchError, filter, switchMap } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAuth();
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.checkAuth();
  }

  private checkAuth(): Observable<boolean | UrlTree> {
    // 1. Verificación síncrona si el usuario ya está autenticado en memoria
    if (this.authService.isAuthenticated()) {
      return of(true);
    }

    // 2. Esperar a que la inicialización de autenticación (y resolución de OAuth) termine
    return this.authService.authInitialized$.pipe(
      filter(init => init === true),
      take(1),
      switchMap(() => {
        const user = this.authService.getCurrentUser();
        if (user) {
          return of(true);
        }

        // Si no hay usuario activo, redirigir a iniciar sesión limpiamente
        return of(this.router.createUrlTree(['/cuenta/iniciar-sesion'], {
          queryParams: { returnUrl: this.router.url }
        }));
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/cuenta/iniciar-sesion']));
      })
    );
  }
}
