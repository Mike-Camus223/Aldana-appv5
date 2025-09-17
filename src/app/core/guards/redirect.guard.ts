import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of, map, take, delay, switchMap } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    console.log('🚫 RedirectGuard: Verificando si usuario autenticado intenta acceder a ruta de auth...');
    
    // Verificación síncrona primero
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      console.log('🚫 RedirectGuard: Usuario YA autenticado detectado, bloqueando acceso a ruta de auth');
      console.log('🚫 Usuario:', currentUser.email);
      
      // Usuario autenticado, redirigir según el rol
      if (this.authService.isAdmin()) {
        console.log('🚫 RedirectGuard: Redirigiendo admin a /dashboard');
        return of(this.router.createUrlTree(['/dashboard']));
      } else {
        console.log('🚫 RedirectGuard: Redirigiendo usuario normal a /panel-control');
        return of(this.router.createUrlTree(['/panel-control']));
      }
    }

    // Verificación asíncrona con delay para dar tiempo a Supabase
    console.log('🚫 RedirectGuard: No hay usuario síncrono, esperando inicialización de Supabase...');
    return of(null).pipe(
      delay(100), // Esperar 100ms para que Supabase inicialice
      switchMap(() => this.authService.currentUser$),
      take(1),
      map(user => {
        if (user) {
          console.log('🚫 RedirectGuard: Usuario YA autenticado detectado (asíncrono), bloqueando acceso');
          console.log('🚫 Usuario:', user.email);
          
          if (this.authService.isAdmin()) {
            console.log('🚫 RedirectGuard: Redirigiendo admin a /dashboard');
            return this.router.createUrlTree(['/dashboard']);
          } else {
            console.log('🚫 RedirectGuard: Redirigiendo usuario normal a /panel-control');
            return this.router.createUrlTree(['/panel-control']);
          }
        }
        
        console.log('🚫 RedirectGuard: Usuario NO autenticado, permitiendo acceso a ruta de auth');
        return true;
      })
    );
  }
}
