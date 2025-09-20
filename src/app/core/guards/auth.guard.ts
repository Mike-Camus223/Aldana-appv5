import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, take, catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private retryCount = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.checkAuthentication();
  }

  private checkAuthentication(): Observable<boolean | UrlTree> {
    
    // Verificación síncrona primero para mejor rendimiento
    const currentUser = this.authService.getCurrentUser();
    const currentSession = this.authService.getCurrentSession();
    
    if (currentUser && currentSession) {
      // Verificar si la sesión no ha expirado
      if (this.isSessionValid(currentSession)) {
        this.logSecurityEvent('AUTH_SUCCESS', currentUser.email || 'unknown');
        return of(true);
      } else {
        console.warn(' AuthGuard: Sesión expirada, cerrando sesión...');
        this.logSecurityEvent('SESSION_EXPIRED', currentUser.email || 'unknown');
        return this.handleExpiredSession();
      }
    }

    // Verificación asíncrona como respaldo
    return this.authService.session$.pipe(
      take(1),
      switchMap(session => {
        if (session && session.user) {
          if (this.isSessionValid(session)) {
            this.logSecurityEvent('AUTH_SUCCESS_ASYNC', session.user.email || 'unknown');
            this.retryCount = 0; // Reset retry count on success
            return of(true);
          } else {
            console.warn(' AuthGuard: Sesión expirada (verificación asíncrona)');
            this.logSecurityEvent('SESSION_EXPIRED_ASYNC', session.user.email || 'unknown');
            return this.handleExpiredSession();
          }
        } else {
          this.logSecurityEvent('AUTH_FAILED', 'anonymous');
          return of(this.router.createUrlTree(['/login']));
        }
      }),
      catchError(error => {
        console.error(' AuthGuard: Error en verificación de autenticación:', error);
        this.logSecurityEvent('AUTH_ERROR', 'unknown', { error: error.message });
        
        // Implementar retry logic
        if (this.retryCount < this.MAX_RETRY_ATTEMPTS) {
          this.retryCount++;
          return this.checkAuthentication();
        }
        
        // Si falla después de varios intentos, redirigir a login
        this.retryCount = 0;
        return of(this.router.createUrlTree(['/login']));
      })
    );
  }

  private isSessionValid(session: any): boolean {
    if (!session || !session.expires_at) {
      return false;
    }

    const expirationTime = new Date(session.expires_at * 1000);
    const currentTime = new Date();
    const timeUntilExpiry = expirationTime.getTime() - currentTime.getTime();
    
    // Considerar sesión inválida si expira en menos de 5 minutos
    const MINIMUM_TIME_BUFFER = 5 * 60 * 1000; // 5 minutos
    
    if (timeUntilExpiry < MINIMUM_TIME_BUFFER) {
      console.warn(' AuthGuard: Sesión próxima a expirar, requiere renovación');
      return false;
    }

    return true;
  }

  private handleExpiredSession(): Observable<UrlTree> {
    // Cerrar sesión automáticamente si la sesión ha expirado
    this.authService.signOut().then(() => {
    }).catch(error => {
      console.error(' AuthGuard: Error al cerrar sesión expirada:', error);
    });

    return of(this.router.createUrlTree(['/login'], {
      queryParams: { reason: 'session_expired' }
    }));
  }

  private logSecurityEvent(event: string, userEmail: string | undefined, metadata?: any): void {
    if (isPlatformBrowser(this.platformId)) {
      const safeEmail = userEmail || 'unknown';
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        userEmail: safeEmail,
        userAgent: navigator.userAgent,
        url: window.location.href,
        metadata
      };
          
      // En producción, enviar estos logs a un servicio de monitoreo
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, {
          custom_parameter_1: safeEmail,
          custom_parameter_2: metadata ? JSON.stringify(metadata) : ''
        });
      }
    }
  }
}
