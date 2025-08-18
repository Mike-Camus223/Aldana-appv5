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
    
    // Verificar si es una ruta de confirmación
    if (routePath === 'register-confirm' || routePath === 'register-success') {
      // Obtener el estado de confirmación del sessionStorage
      const confirmationState = sessionStorage.getItem(ConfirmationGuard.CONFIRMATION_KEY);
      
      // Verificar si hay un estado de confirmación válido
      if (confirmationState) {
        try {
          const { timestamp, path } = JSON.parse(confirmationState);
          const now = Date.now();
          
          // Verificar si la ruta coincide y no ha expirado
          if (path === routePath && (now - timestamp) < ConfirmationGuard.CONFIRMATION_EXPIRY) {
            // Eliminar el estado para que no se pueda volver a usar
            sessionStorage.removeItem(ConfirmationGuard.CONFIRMATION_KEY);
            return true;
          }
        } catch (e) {
          console.error('Error al parsear estado de confirmación', e);
        }
      }
      
      // Redirigir a home si no hay un estado de confirmación válido
      this.router.navigate(['/home']);
      return false;
    }
    
    return true;
  }

  /**
   * Establece el estado de confirmación para permitir el acceso a las rutas de confirmación
   * @param path Ruta que se va a permitir ('register-confirm' o 'register-success')
   */
  public static setConfirmationState(path: 'register-confirm' | 'register-success'): void {
    const state = {
      timestamp: Date.now(),
      path: path
    };
    sessionStorage.setItem(this.CONFIRMATION_KEY, JSON.stringify(state));
  }
}
