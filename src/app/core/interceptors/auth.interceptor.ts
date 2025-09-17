import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap, catchError, from } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  
  // URLs que no requieren autenticación
  private readonly PUBLIC_URLS = [
    '/auth/',
    '/public/',
    'supabase.co/auth/v1/signup',
    'supabase.co/auth/v1/token',
    'supabase.co/auth/v1/recover'
  ];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Log de request para auditoría
    this.logRequest(request);

    // Verificar si es una URL pública
    if (this.isPublicUrl(request.url)) {
      return next.handle(request);
    }

    // Obtener token de autenticación
    const session = this.authService.getCurrentSession();
    
    if (session?.access_token) {
      // Verificar si el token está próximo a expirar
      if (this.isTokenNearExpiry(session)) {
        console.warn('Token próximo a expirar, iniciando refresh automático');
        return this.handleTokenRefresh(request, next);
      }

      // Agregar token a la request
      request = this.addTokenToRequest(request, session.access_token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleHttpError(error, request, next);
      })
    );
  }

  private isPublicUrl(url: string): boolean {
    return this.PUBLIC_URLS.some(publicUrl => url.includes(publicUrl));
  }

  private isTokenNearExpiry(session: any): boolean {
    if (!session.expires_at) return false;

    const expirationTime = new Date(session.expires_at * 1000);
    const currentTime = new Date();
    const timeUntilExpiry = expirationTime.getTime() - currentTime.getTime();
    
    // Considerar "próximo a expirar" si quedan menos de 10 minutos
    const EXPIRY_THRESHOLD = 10 * 60 * 1000; // 10 minutos
    
    return timeUntilExpiry < EXPIRY_THRESHOLD;
  }

  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'X-Client-Info': 'angular-ecommerce',
        'X-Request-ID': this.generateRequestId()
      }
    });
  }

  private handleTokenRefresh(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.authService.refreshToken()).pipe(
        switchMap((result: { success: boolean; error?: string }) => {
          this.isRefreshing = false;
          
          if (result.success) {
            const newSession = this.authService.getCurrentSession();
            this.refreshTokenSubject.next(newSession?.access_token);
            
            // Reintentar la request original con el nuevo token
            if (newSession?.access_token) {
              const newRequest = this.addTokenToRequest(request, newSession.access_token);
              return next.handle(newRequest);
            }
          }
          
          // Si falla el refresh, redirigir a login
          this.handleAuthenticationFailure();
          return throwError(() => new Error('Token refresh failed'));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.handleAuthenticationFailure();
          return throwError(() => error);
        })
      );
    } else {
      // Si ya se está refrescando, esperar a que termine
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          const newRequest = this.addTokenToRequest(request, token);
          return next.handle(newRequest);
        })
      );
    }
  }

  private handleHttpError(error: HttpErrorResponse, request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.logError(error, request);

    if (error.status === 401) {
      // Token inválido o expirado
      console.warn('Token inválido detectado (401), iniciando proceso de refresh');
      
      if (!this.isRefreshing) {
        return this.handleTokenRefresh(request, next);
      }
    } else if (error.status === 403) {
      // Acceso denegado
      console.error('Acceso denegado (403)');
      this.logSecurityEvent('ACCESS_DENIED', request.url, {
        status: error.status,
        message: error.message
      });
    } else if (error.status === 429) {
      // Rate limit excedido
      console.error('Rate limit excedido (429)');
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED_HTTP', request.url, {
        status: error.status,
        retryAfter: error.headers.get('Retry-After')
      });
    } else if (error.status >= 500) {
      // Error del servidor
      console.error('Error del servidor:', error.status);
      this.logSecurityEvent('SERVER_ERROR', request.url, {
        status: error.status,
        message: error.message
      });
    }

    return throwError(() => error);
  }

  private handleAuthenticationFailure(): void {
    console.error('Fallo de autenticación, cerrando sesión');
    
    this.logSecurityEvent('AUTHENTICATION_FAILURE', window.location.href);
    
    // Cerrar sesión y redirigir
    this.authService.signOut().then(() => {
      this.router.navigate(['/login'], {
        queryParams: { reason: 'session_invalid' }
      });
    });
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private logRequest(request: HttpRequest<any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: this.sanitizeUrl(request.url),
      hasAuth: request.headers.has('Authorization'),
      userAgent: navigator.userAgent,
      requestId: this.generateRequestId()
    };

    // Solo loggear requests importantes (no assets estáticos)
    if (!this.isStaticAsset(request.url)) {
      console.warn('HTTP request:', logEntry);
    }
  }

  private logError(error: HttpErrorResponse, request: HttpRequest<any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: this.sanitizeUrl(request.url),
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      userAgent: navigator.userAgent
    };

    console.error('🚨 HTTP Error:', logEntry);

    // Enviar errores críticos a servicio de monitoreo
    if (error.status === 401 || error.status === 403 || error.status >= 500) {
      this.sendToMonitoring('HTTP_ERROR', logEntry);
    }
  }

  private logSecurityEvent(event: string, url: string, metadata?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      url: this.sanitizeUrl(url),
      userAgent: navigator.userAgent,
      metadata
    };
    this.sendToMonitoring(event, logEntry);
  }

  private sanitizeUrl(url: string): string {
    // Remover parámetros sensibles de la URL para logs
    try {
      const urlObj = new URL(url);
      
      // Remover parámetros sensibles
      const sensitiveParams = ['token', 'access_token', 'refresh_token', 'password', 'key'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '***');
        }
      });
      
      return urlObj.toString();
    } catch {
      return url.replace(/([?&])(token|access_token|refresh_token|password|key)=[^&]*/gi, '$1$2=***');
    }
  }

  private isStaticAsset(url: string): boolean {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private sendToMonitoring(event: string, data: any): void {
    // En producción, enviar a servicio de monitoreo como Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        custom_parameter_1: data.url || 'unknown',
        custom_parameter_2: JSON.stringify(data),
        custom_parameter_3: 'auth_interceptor'
      });
    }

    // También almacenar localmente para debugging
    try {
      const logs = JSON.parse(localStorage.getItem('http_security_logs') || '[]');
      logs.push({ event, data, timestamp: new Date().toISOString() });
      
      // Mantener solo los últimos 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('http_security_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Error storing security log:', error);
    }
  }
}
