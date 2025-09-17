import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, catchError, of, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanActivateChild {
  private authService = inject(AuthService);
  private router = inject(Router);
  private readonly MAX_RETRY_ATTEMPTS = 2;
  private retryCount = 0;

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAdminAccess();
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.checkAdminAccess();
  }

  private checkAdminAccess(): Observable<boolean | UrlTree> {

    return this.authService.session$.pipe(
      take(1),
      switchMap(session => {
        if (!session || !session.user) {
          console.warn('AdminGuard: Usuario no autenticado');
          this.logSecurityEvent('ADMIN_ACCESS_DENIED_NO_AUTH', 'anonymous');
          return of(this.router.createUrlTree(['/login']));
        }

        // Verificar rol del cliente primero (verificación rápida)
        const clientRole = this.authService.getUserRole();
        if (clientRole !== 'admin') {
          console.warn('AdminGuard: Rol de cliente no es admin:', clientRole);
          this.logSecurityEvent('ADMIN_ACCESS_DENIED_CLIENT_ROLE', session.user.email, { clientRole });
          return of(this.router.createUrlTree(['/home']));
        }

        // Verificar rol desde el servidor para mayor seguridad
        return this.verifyAdminRoleFromServer(session.user.id, session.user.email || 'unknown');
      }),
      catchError(error => {
        console.error('AdminGuard: Error en verificación de admin:', error);
        this.logSecurityEvent('ADMIN_ACCESS_ERROR', 'unknown', { error: error.message });
        
        // Implementar retry logic
        if (this.retryCount < this.MAX_RETRY_ATTEMPTS) {
          this.retryCount++;
          return this.checkAdminAccess();
        }
        
        this.retryCount = 0;
        return of(this.router.createUrlTree(['/home']));
      })
    );
  }

  private verifyAdminRoleFromServer(userId: string, userEmail: string): Observable<boolean | UrlTree> {
    
    return new Observable(observer => {
      // Usar el cliente autenticado de Supabase para verificar el rol
      const supabaseClient = this.authService.getAuthenticatedClient();
      
      // Verificar el rol desde la tabla de usuarios o metadata del usuario
      supabaseClient.auth.getUser().then(({ data: { user }, error }) => {
        if (error || !user) {
          console.error('AdminGuard: Error al obtener usuario del servidor:', error);
          this.logSecurityEvent('ADMIN_SERVER_VERIFICATION_ERROR', userEmail, { error: error?.message });
          observer.next(this.router.createUrlTree(['/home']));
          observer.complete();
          return;
        }

        // Verificar rol desde user_metadata (método principal)
        const serverRole = user.user_metadata?.['role'];
        
        if (serverRole === 'admin') {
          this.logSecurityEvent('ADMIN_ACCESS_GRANTED', userEmail, { serverRole });
          this.retryCount = 0;
          observer.next(true);
        } else {
          console.warn('AdminGuard: Rol del servidor no es admin:', serverRole);
          this.logSecurityEvent('ADMIN_ACCESS_DENIED_SERVER_ROLE', userEmail, { serverRole });
          observer.next(this.router.createUrlTree(['/home']));
        }
        
        observer.complete();
      }).catch(serverError => {
        console.error('AdminGuard: Error de conexión con servidor:', serverError);
        this.logSecurityEvent('ADMIN_SERVER_CONNECTION_ERROR', userEmail, { error: serverError.message });
        
        // En caso de error del servidor, denegar acceso por seguridad
        observer.next(this.router.createUrlTree(['/home']));
        observer.complete();
      });
    });
  }

  private logSecurityEvent(event: string, userEmail: string | undefined, metadata?: any): void {
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
        custom_parameter_2: metadata ? JSON.stringify(metadata) : '',
        custom_parameter_3: 'admin_guard'
      });
    }

    // Almacenar eventos críticos
    if (event.includes('DENIED') || event.includes('BLOCKED')) {
      this.storeSecurityAlert(logEntry);
    }
  }

  private getClientIP(): string {
    // En un entorno real, esto se obtendría del servidor
    // Por ahora, retornamos un placeholder
    return 'client-side';
  }

  private storeSecurityAlert(logEntry: any): void {
    try {
      const alerts = JSON.parse(localStorage.getItem('security_alerts') || '[]');
      alerts.push(logEntry);
      
      // Mantener solo los últimos 50 eventos
      if (alerts.length > 50) {
        alerts.splice(0, alerts.length - 50);
      }
      
      localStorage.setItem('security_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('AdminGuard: Error al almacenar alerta de seguridad:', error);
    }
  }
}
