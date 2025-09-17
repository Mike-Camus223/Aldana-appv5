import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of, map, take, delay, switchMap } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockUntil?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // Rate limiting configuration
  private readonly MAX_ATTEMPTS_PER_WINDOW = 10; // Máximo 10 intentos por ventana
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos
  private readonly BLOCK_DURATION = 30 * 60 * 1000; // 30 minutos de bloqueo
  private readonly STORAGE_KEY = 'redirect_guard_rate_limit';

  canActivate(): Observable<boolean | UrlTree> {
    // Verificar rate limiting primero
    if (this.isRateLimited()) {
      console.warn('Alerta de guard: Rate limit excedido, bloqueando acceso');
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', 'anonymous');
      return of(this.router.createUrlTree(['/home'], {
        queryParams: { error: 'too_many_attempts' }
      }));
    }

    // Registrar intento de acceso
    this.recordAttempt();
    
    // Verificación síncrona primero
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {      
      this.logSecurityEvent('AUTHENTICATED_USER_BLOCKED', currentUser.email || 'unknown');
      
      // Usuario autenticado, redirigir según el rol
      if (this.authService.isAdmin()) {
        return of(this.router.createUrlTree(['/dashboard']));
      } else {
        return of(this.router.createUrlTree(['/panel-control']));
      }
    }

    // Verificación asíncrona con delay para dar tiempo a Supabase
    return of(null).pipe(
      delay(100), // Esperar 100ms para que Supabase inicialice
      switchMap(() => this.authService.currentUser$),
      take(1),
      map(user => {
        if (user) {          
          this.logSecurityEvent('AUTHENTICATED_USER_BLOCKED_ASYNC', user.email || 'unknown');
          
          if (this.authService.isAdmin()) {
            return this.router.createUrlTree(['/dashboard']);
          } else {
            return this.router.createUrlTree(['/panel-control']);
          }
        }
        
        this.logSecurityEvent('UNAUTHENTICATED_ACCESS_ALLOWED', 'anonymous');
        return true;
      })
    );
  }

  private isRateLimited(): boolean {
    try {
      const rateLimitData = this.getRateLimitData();
      const now = Date.now();

      // Si está bloqueado, verificar si el bloqueo ha expirado
      if (rateLimitData.blocked && rateLimitData.blockUntil) {
        if (now < rateLimitData.blockUntil) {
          return true; // Aún bloqueado
        } else {
          // Bloqueo expirado, resetear
          this.resetRateLimit();
          return false;
        }
      }

      // Verificar si está dentro de la ventana de tiempo
      const timeSinceFirst = now - rateLimitData.firstAttempt;
      
      if (timeSinceFirst > this.RATE_LIMIT_WINDOW) {
        // Ventana expirada, resetear
        this.resetRateLimit();
        return false;
      }

      // Verificar si excede el límite
      if (rateLimitData.count >= this.MAX_ATTEMPTS_PER_WINDOW) {
        // Bloquear usuario
        this.blockUser();
        return true;
      }

      return false;
    } catch (error) {
      return false; // En caso de error, permitir acceso
    }
  }

  private recordAttempt(): void {
    try {
      const rateLimitData = this.getRateLimitData();
      const now = Date.now();

      rateLimitData.count++;
      rateLimitData.lastAttempt = now;

      if (rateLimitData.count === 1) {
        rateLimitData.firstAttempt = now;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rateLimitData));

      // Log si se están acercando al límite
      if (rateLimitData.count >= this.MAX_ATTEMPTS_PER_WINDOW * 0.8) {
        console.warn(`Alerta de guards: Advertencia - ${rateLimitData.count}/${this.MAX_ATTEMPTS_PER_WINDOW} intentos`);
        this.logSecurityEvent('RATE_LIMIT_WARNING', 'anonymous', { 
          attempts: rateLimitData.count,
          maxAttempts: this.MAX_ATTEMPTS_PER_WINDOW 
        });
      }
    } catch (error) {
      console.error('Error de guards: Error registrando intento:', error);
    }
  }

  private getRateLimitData(): RateLimitEntry {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error de guards: Error leyendo rate limit data:', error);
    }

    return {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      blocked: false
    };
  }

  private blockUser(): void {
    try {
      const rateLimitData = this.getRateLimitData();
      rateLimitData.blocked = true;
      rateLimitData.blockUntil = Date.now() + this.BLOCK_DURATION;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rateLimitData));
      
      console.error('Error de guards: Usuario bloqueado por exceder rate limit');
      this.logSecurityEvent('USER_BLOCKED_RATE_LIMIT', 'anonymous', {
        attempts: rateLimitData.count,
        blockDuration: this.BLOCK_DURATION / 1000 / 60 // en minutos
      });
    } catch (error) {
      console.error('Error de guards: Error bloqueando usuario:', error);
    }
  }

  private resetRateLimit(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error de guards: Error reseteando rate limit:', error);
    }
  }

  private maskEmail(email: string): string {
    if (!email || email.length < 3) return '***';
    
    const [localPart, domain] = email.split('@');
    if (!domain) return '***';
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : '**';
    
    return `${maskedLocal}@${domain}`;
  }

  private logSecurityEvent(event: string, userEmail: string | undefined, metadata?: any): void {
    const safeEmail = userEmail === 'anonymous' ? 'anonymous' : (userEmail ? this.maskEmail(userEmail) : 'unknown');
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userEmail: safeEmail,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      metadata
    };
        
    // En producción, enviar estos logs a un servicio de monitoreo
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        custom_parameter_1: logEntry.userEmail,
        custom_parameter_2: metadata ? JSON.stringify(metadata) : '',
        custom_parameter_3: 'redirect_guard'
      });
    }

    // Almacenar eventos críticos
    if (event.includes('RATE_LIMIT') || event.includes('BLOCKED')) {
      this.storeSecurityAlert(logEntry);
    }
  }

  private storeSecurityAlert(logEntry: any): void {
    try {
      const alerts = JSON.parse(localStorage.getItem('redirect_security_alerts') || '[]');
      alerts.push(logEntry);
      
      // Mantener solo los últimos 100 eventos
      if (alerts.length > 100) {
        alerts.splice(0, alerts.length - 100);
      }
      
      localStorage.setItem('redirect_security_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Error de guards: Error almacenando alerta:', error);
    }
  }
}
