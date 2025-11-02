import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationGuard implements CanActivate {
  private static readonly CONFIRMATION_KEY = 'account_confirmation';
  private static readonly CONFIRMATION_EXPIRY = 5 * 60 * 1000; // 5 minutos

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const routePath = route.routeConfig?.path;

    if (routePath === 'confirmar-registro' || routePath === 'registro-exitoso') {
      const confirmationState = sessionStorage.getItem(ConfirmationGuard.CONFIRMATION_KEY);
      
      // Log de depuración
      console.log('ConfirmationGuard - Route path:', routePath);
      console.log('ConfirmationGuard - Confirmation state:', confirmationState);

      if (confirmationState) {
        try {
          const { timestamp, path } = JSON.parse(confirmationState);
          const now = Date.now();
          
          console.log('ConfirmationGuard - Parsed state:', { timestamp, path, now, expiry: ConfirmationGuard.CONFIRMATION_EXPIRY });
          console.log('ConfirmationGuard - Path match:', path === routePath);
          console.log('ConfirmationGuard - Time valid:', (now - timestamp) < ConfirmationGuard.CONFIRMATION_EXPIRY);

          if (path === routePath && (now - timestamp) < ConfirmationGuard.CONFIRMATION_EXPIRY) {
            // No eliminar el estado aquí, dejar que se mantenga por si hay redirecciones
            // sessionStorage.removeItem(ConfirmationGuard.CONFIRMATION_KEY);
            console.log('ConfirmationGuard - Access granted');
            return true;
          }
        } catch (e) {
          console.error('Error al parsear estado de confirmación', e);
        }
      }

      console.log('ConfirmationGuard - Access denied, redirecting to home');
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }

  public static setConfirmationState(path: 'confirmar-registro' | 'registro-exitoso'): void {
    const state = {
      timestamp: Date.now(),
      path: path
    };
    sessionStorage.setItem(this.CONFIRMATION_KEY, JSON.stringify(state));
    
    // Log de depuración
    console.log('ConfirmationGuard - State saved:', state);
    console.log('ConfirmationGuard - sessionStorage key:', this.CONFIRMATION_KEY);
    console.log('ConfirmationGuard - sessionStorage value:', sessionStorage.getItem(this.CONFIRMATION_KEY));
    
    // Limpiar automáticamente después de 5 minutos
    setTimeout(() => {
      this.clearConfirmationState();
    }, this.CONFIRMATION_EXPIRY);
  }

  public static clearConfirmationState(): void {
    sessionStorage.removeItem(this.CONFIRMATION_KEY);
  }
}
