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

      if (confirmationState) {
        try {
          const { timestamp, path } = JSON.parse(confirmationState);
          const now = Date.now();

          if (path === routePath && (now - timestamp) < ConfirmationGuard.CONFIRMATION_EXPIRY) {
            sessionStorage.removeItem(ConfirmationGuard.CONFIRMATION_KEY);
            return true;
          }
        } catch (e) {
          console.error('Error al parsear estado de confirmación', e);
        }
      }

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
  }
}
