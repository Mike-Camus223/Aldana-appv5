import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, take, of, catchError } from 'rxjs';
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

    // 2. Verificación asíncrona reactiva con currentUser$
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        }

        // Si no hay usuario activo, redirigir a iniciar sesión limpiamente sin bucles ni llamadas destructivas
        return this.router.createUrlTree(['/cuenta/iniciar-sesion'], {
          queryParams: { returnUrl: this.router.url }
        });
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/cuenta/iniciar-sesion']));
      })
    );
  }
}
