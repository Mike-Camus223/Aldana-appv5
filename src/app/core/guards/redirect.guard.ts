import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { isPlatformBrowser } from '@angular/common';

interface SuspiciousActivityEntry {
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
  private platformId = inject(PLATFORM_ID);
  
  // Configuración solo para actividad sospechosa
  private readonly MAX_SUSPICIOUS_ATTEMPTS = 50;
  private readonly SUSPICIOUS_WINDOW = 5 * 60 * 1000;
  private readonly BLOCK_DURATION = 10 * 60 * 1000;
  private readonly STORAGE_KEY = 'suspicious_activity_rate_limit';

  // Propiedad para verificar si estamos en el navegador
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const currentPath = route.routeConfig?.path;
    
    // Excluir rutas de confirmación del rate limiting
    const isConfirmationRoute = currentPath === 'confirmar-registro' || currentPath === 'registro-exitoso';
    
    // 1. Verificar si es actividad sospechosa (solo en browser)
    if (this.isBrowser && !isConfirmationRoute && this.isSuspiciousActivity() && this.shouldApplyRateLimit()) {
      console.warn('Actividad sospechosa detectada, aplicando rate limit');
      this.logSecurityEvent('SUSPICIOUS_ACTIVITY_BLOCKED', 'suspicious_ip');
      return of(this.router.createUrlTree(['/']));
    }

    // 2. Registrar intento solo si es sospechoso y en browser (y no es ruta de confirmación)
    if (this.isBrowser && !isConfirmationRoute && this.shouldApplyRateLimit()) {
      this.recordSuspiciousAttempt();
    }

    // 3. Verificar si el usuario YA está autenticado (lógica principal del guard)
    const currentUser = this.authService.getCurrentUser();
    
    // Permitir acceso a rutas de confirmación incluso si está autenticado
    if (currentPath === 'confirmar-registro' || currentPath === 'registro-exitoso') {
      return of(true);
    }
    
    if (currentUser) {      
      this.logSecurityEvent('AUTHENTICATED_USER_REDIRECT', currentUser.email || 'unknown');
      
      // Usuario autenticado, redirigir según el rol
      if (this.authService.isAdmin()) {
        return of(this.router.createUrlTree(['/admin/home']));
      } else {
        return of(this.router.createUrlTree(['/panel/panel-control']));
      }
    }

    // 4. Usuario NO autenticado → PERMITIR acceso (siempre para ecommerce)
    return of(true);
  }

  private shouldApplyRateLimit(): boolean {
    // Solo aplicar en browser y a actividad claramente sospechosa
    if (!this.isBrowser) return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const suspiciousPatterns = [
      'bot', 'crawler', 'scanner', 'spider', 'python-requests', 'curl',
      'wget', 'masscan', 'sqlmap', 'nikto', 'acunetix', 'nessus'
    ];
    
    const isSuspiciousUserAgent = suspiciousPatterns.some(pattern => 
      userAgent.includes(pattern)
    );

    // También verificar patrones de acceso sospechosos
    const activityData = this.getSuspiciousActivityData();
    const now = Date.now();
    const isRapidFire = activityData.count > 10 && 
                       (now - activityData.firstAttempt) < 30000;

    return isSuspiciousUserAgent || isRapidFire;
  }

  private isSuspiciousActivity(): boolean {
    if (!this.isBrowser) return false;

    try {
      const activityData = this.getSuspiciousActivityData();
      const now = Date.now();

      if (activityData.blocked && activityData.blockUntil) {
        if (now < activityData.blockUntil) {
          return true;
        } else {
          this.resetSuspiciousActivity();
          return false;
        }
      }

      const timeSinceFirst = now - activityData.firstAttempt;
      
      if (timeSinceFirst > this.SUSPICIOUS_WINDOW) {
        this.resetSuspiciousActivity();
        return false;
      }

      if (activityData.count >= this.MAX_SUSPICIOUS_ATTEMPTS) {
        this.blockSuspiciousActivity();
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  private recordSuspiciousAttempt(): void {
    if (!this.isBrowser) return;

    try {
      const activityData = this.getSuspiciousActivityData();
      const now = Date.now();

      activityData.count++;
      activityData.lastAttempt = now;

      if (activityData.count === 1) {
        activityData.firstAttempt = now;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activityData));

      if (activityData.count >= this.MAX_SUSPICIOUS_ATTEMPTS * 0.6) {
        console.warn(`Actividad sospechosa detectada: ${activityData.count}/${this.MAX_SUSPICIOUS_ATTEMPTS} intentos`);
        this.logSecurityEvent('SUSPICIOUS_ACTIVITY_DETECTED', 'suspicious_ip', { 
          attempts: activityData.count,
          maxAttempts: this.MAX_SUSPICIOUS_ATTEMPTS 
        });
      }
    } catch (error) {
      console.error('Error registrando actividad sospechosa:', error);
    }
  }

  private getSuspiciousActivityData(): SuspiciousActivityEntry {
    if (!this.isBrowser) {
      return {
        count: 0,
        firstAttempt: Date.now(),
        lastAttempt: Date.now(),
        blocked: false
      };
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error leyendo datos de actividad sospechosa:', error);
    }

    return {
      count: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      blocked: false
    };
  }

  private blockSuspiciousActivity(): void {
    if (!this.isBrowser) return;

    try {
      const activityData = this.getSuspiciousActivityData();
      activityData.blocked = true;
      activityData.blockUntil = Date.now() + this.BLOCK_DURATION;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activityData));
      
      console.error('Actividad sospechosa bloqueada por rate limit');
      this.logSecurityEvent('SUSPICIOUS_ACTIVITY_BLOCKED_RATE_LIMIT', 'suspicious_ip', {
        attempts: activityData.count,
        blockDuration: this.BLOCK_DURATION / 1000 / 60
      });
    } catch (error) {
      console.error('Error bloqueando actividad sospechosa:', error);
    }
  }

  private resetSuspiciousActivity(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error reseteando actividad sospechosa:', error);
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

  private logSecurityEvent(event: string, userEmail: string, metadata?: any): void {
    // Solo log en browser
    if (!this.isBrowser) return;

    const safeEmail = userEmail === 'suspicious_ip' ? 'suspicious_ip' : 
                     (userEmail ? this.maskEmail(userEmail) : 'unknown');
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userEmail: safeEmail,
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      metadata
    };

    if (event.includes('BLOCKED') || event.includes('SUSPICIOUS')) {
      console.log('Evento de seguridad:', logEntry);
    }
        
    // Google Analytics solo en browser
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        custom_parameter_1: logEntry.userEmail,
        custom_parameter_2: metadata ? JSON.stringify(metadata) : '',
        custom_parameter_3: 'redirect_guard'
      });
    }

    if (event.includes('SUSPICIOUS') || event.includes('BLOCKED')) {
      this.storeSecurityAlert(logEntry);
    }
  }

  private storeSecurityAlert(logEntry: any): void {
    if (!this.isBrowser) return;

    try {
      const alerts = JSON.parse(localStorage.getItem('security_alerts') || '[]');
      alerts.push(logEntry);
      
      if (alerts.length > 50) {
        alerts.splice(0, alerts.length - 50);
      }
      
      localStorage.setItem('security_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Error almacenando alerta de seguridad:', error);
    }
  }
}