import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    console.log('🛡️ AuthGuard: Verificando autenticación para acceso a ruta protegida...');
    
    // Verificación síncrona primero
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      console.log('🛡️ AuthGuard: Usuario autenticado, permitiendo acceso');
      console.log('🛡️ Usuario:', currentUser.email);
      return new Observable(observer => observer.next(true));
    }

    // Verificación asíncrona como respaldo
    console.log('🛡️ AuthGuard: No hay usuario síncrono, verificando de forma asíncrona...');
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          console.log('🛡️ AuthGuard: Usuario autenticado (asíncrono), permitiendo acceso');
          console.log('🛡️ Usuario:', user.email);
          return true;
        } else {
          console.log('🛡️ AuthGuard: Usuario NO autenticado, redirigiendo a /login');
          return this.router.createUrlTree(['/login']);
        }
      })
    );
  }
}
