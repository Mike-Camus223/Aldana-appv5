import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'ACCESS' | 'RATE_LIMIT' | 'SUSPICIOUS' | 'ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  userEmail?: string;
  userAgent: string;
  ip?: string;
  url: string;
  metadata?: any;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  events: SecurityEvent[];
  acknowledged: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private eventsSubject = new BehaviorSubject<SecurityEvent[]>([]);
  private alertsSubject = new BehaviorSubject<SecurityAlert[]>([]);

  // Configuraciones de seguridad
  private readonly MAX_EVENTS = 1000;
  private readonly MAX_ALERTS = 50;
  private readonly SUSPICIOUS_PATTERNS = {
    RAPID_FAILED_LOGINS: { count: 5, timeWindow: 5 * 60 * 1000 }, // 5 intentos en 5 minutos
    MULTIPLE_IP_ACCESS: { count: 3, timeWindow: 10 * 60 * 1000 }, // 3 IPs diferentes en 10 minutos
    UNUSUAL_ACCESS_PATTERN: { count: 20, timeWindow: 60 * 60 * 1000 }, // 20 requests en 1 hora
    ADMIN_ACCESS_ATTEMPTS: { count: 3, timeWindow: 15 * 60 * 1000 } // 3 intentos admin en 15 minutos
  };

  constructor() {
    this.loadStoredData();
    this.startSecurityMonitoring();
  }

  /**
   * Observable de eventos de seguridad
   */
  get events$(): Observable<SecurityEvent[]> {
    return this.eventsSubject.asObservable();
  }

  /**
   * Observable de alertas de seguridad
   */
  get alerts$(): Observable<SecurityAlert[]> {
    return this.alertsSubject.asObservable();
  }

  /**
   * Registra un evento de seguridad
   */
  logSecurityEvent(
    type: SecurityEvent['type'],
    source: string,
    userEmail?: string,
    metadata?: any
  ): void {
    const event: SecurityEvent = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type,
      severity: this.calculateSeverity(type, metadata),
      source,
      userEmail: userEmail ? this.maskEmail(userEmail) : undefined,
      userAgent: navigator.userAgent,
      ip: this.getClientIP(),
      url: window.location.href,
      metadata
    };

    this.addEvent(event);
    this.analyzeForSuspiciousActivity(event);
    this.persistData();

    console.log(`Evento de Seguridad [${event.severity}]:`, event);
  }

  /**
   * Obtiene estadísticas de seguridad
   */
  getSecurityStats(): {
    totalEvents: number;
    activeAlerts: number;
    criticalAlerts: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
  } {
    const activeAlerts = this.alerts.filter(alert => !alert.acknowledged);
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'CRITICAL');

    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = this.events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents: this.events.length,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      eventsByType,
      eventsBySeverity
    };
  }

  /**
   * Marca una alerta como reconocida
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.alertsSubject.next([...this.alerts]);
      this.persistData();
    }
  }

  /**
   * Limpia eventos antiguos
   */
  clearOldEvents(olderThanDays: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoffDate
    );

    this.eventsSubject.next([...this.events]);
    this.persistData();

    console.log(`Limpieza de eventos anteriores a ${olderThanDays} dias realizada`);
  }

  /**
   * Exporta datos de seguridad para análisis
   */
  exportSecurityData(): string {
    const data = {
      events: this.events,
      alerts: this.alerts,
      stats: this.getSecurityStats(),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Verifica si hay patrones sospechosos activos
   */
  hasSuspiciousActivity(): boolean {
    return this.alerts.some(alert => 
      !alert.acknowledged && 
      (alert.severity === 'HIGH' || alert.severity === 'CRITICAL')
    );
  }

  private addEvent(event: SecurityEvent): void {
    this.events.unshift(event);

    // Mantener solo los eventos más recientes
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(0, this.MAX_EVENTS);
    }

    this.eventsSubject.next([...this.events]);
  }

  private addAlert(alert: SecurityAlert): void {
    this.alerts.unshift(alert);

    // Mantener solo las alertas más recientes
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, this.MAX_ALERTS);
    }

    this.alertsSubject.next([...this.alerts]);

    // Notificar alerta crítica
    if (alert.severity === 'CRITICAL') {
      this.notifyCriticalAlert(alert);
    }
  }

  private analyzeForSuspiciousActivity(newEvent: SecurityEvent): void {
    const now = Date.now();

    // Analizar intentos de login fallidos rápidos
    if (newEvent.type === 'AUTH' && newEvent.metadata?.event?.includes('FAILED')) {
      this.checkRapidFailedLogins(newEvent, now);
    }

    // Analizar intentos de acceso admin
    if (newEvent.metadata?.event?.includes('ADMIN')) {
      this.checkAdminAccessAttempts(newEvent, now);
    }

    // Analizar patrones de acceso inusuales
    this.checkUnusualAccessPatterns(newEvent, now);
  }

  private checkRapidFailedLogins(event: SecurityEvent, now: number): void {
    const pattern = this.SUSPICIOUS_PATTERNS.RAPID_FAILED_LOGINS;
    const recentFailedLogins = this.events.filter(e => 
      e.type === 'AUTH' &&
      e.metadata?.event?.includes('FAILED') &&
      e.userEmail === event.userEmail &&
      (now - new Date(e.timestamp).getTime()) < pattern.timeWindow
    );

    if (recentFailedLogins.length >= pattern.count) {
      this.createAlert(
        'Intentos de Login Sospechosos',
        `Se detectaron ${recentFailedLogins.length} intentos de login fallidos en ${pattern.timeWindow / 60000} minutos para ${event.userEmail}`,
        'HIGH',
        recentFailedLogins
      );
    }
  }

  private checkAdminAccessAttempts(event: SecurityEvent, now: number): void {
    const pattern = this.SUSPICIOUS_PATTERNS.ADMIN_ACCESS_ATTEMPTS;
    const recentAdminAttempts = this.events.filter(e => 
      e.metadata?.event?.includes('ADMIN') &&
      (now - new Date(e.timestamp).getTime()) < pattern.timeWindow
    );

    if (recentAdminAttempts.length >= pattern.count) {
      this.createAlert(
        'Intentos de Acceso Admin Sospechosos',
        `Se detectaron ${recentAdminAttempts.length} intentos de acceso admin en ${pattern.timeWindow / 60000} minutos`,
        'CRITICAL',
        recentAdminAttempts
      );
    }
  }

  private checkUnusualAccessPatterns(event: SecurityEvent, now: number): void {
    const pattern = this.SUSPICIOUS_PATTERNS.UNUSUAL_ACCESS_PATTERN;
    const recentEvents = this.events.filter(e => 
      (now - new Date(e.timestamp).getTime()) < pattern.timeWindow
    );

    if (recentEvents.length >= pattern.count) {
      this.createAlert(
        'Patrón de Acceso Inusual',
        `Se detectaron ${recentEvents.length} eventos en ${pattern.timeWindow / 60000} minutos`,
        'MEDIUM',
        recentEvents.slice(0, 10) // Solo incluir los primeros 10 eventos
      );
    }
  }

  private createAlert(
    title: string,
    description: string,
    severity: SecurityAlert['severity'],
    events: SecurityEvent[]
  ): void {
    // Verificar si ya existe una alerta similar reciente
    const recentSimilarAlert = this.alerts.find(alert => 
      alert.title === title &&
      !alert.acknowledged &&
      (Date.now() - new Date(alert.timestamp).getTime()) < 30 * 60 * 1000 // 30 minutos
    );

    if (recentSimilarAlert) {
      return; // No crear alerta duplicada
    }

    const alert: SecurityAlert = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      title,
      description,
      severity,
      events,
      acknowledged: false
    };

    this.addAlert(alert);
  }

  private calculateSeverity(type: SecurityEvent['type'], metadata?: any): SecurityEvent['severity'] {
    // Eventos críticos
    if (metadata?.event?.includes('BLOCKED') || 
        metadata?.event?.includes('ADMIN') ||
        type === 'SUSPICIOUS') {
      return 'CRITICAL';
    }

    // Eventos de alta prioridad
    if (metadata?.event?.includes('FAILED') ||
        metadata?.event?.includes('DENIED') ||
        type === 'RATE_LIMIT') {
      return 'HIGH';
    }

    // Eventos de prioridad media
    if (type === 'ACCESS' || type === 'ERROR') {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private startSecurityMonitoring(): void {
    // Limpiar eventos antiguos cada hora
    setInterval(() => {
      this.clearOldEvents(7);
    }, 60 * 60 * 1000);

    // Verificar patrones sospechosos cada 5 minutos
    setInterval(() => {
      this.performSecurityAnalysis();
    }, 5 * 60 * 1000);
  }

  private performSecurityAnalysis(): void {
    const stats = this.getSecurityStats();
    
    // Análisis de tendencias
    if (stats.criticalAlerts > 5) {
      console.warn('Alto numero de alertas criticas detectadas');
    }

    if (stats.eventsByType['AUTH'] && stats.eventsByType['AUTH'] > 50) {
      console.warn('Alto numero de eventos de autenticacion detectados');
    }
  }

  private notifyCriticalAlert(alert: SecurityAlert): void {
    console.error('ALERTA CRITICA DE SEGURIDAD:', alert);
    
    // En producción, enviar notificación push, email, etc.
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerta de Seguridad Crítica', {
        body: alert.description,
        icon: '/assets/icons/security-alert.png'
      });
    }
  }

  private loadStoredData(): void {
    try {
      const storedEvents = localStorage.getItem('security_events');
      const storedAlerts = localStorage.getItem('security_alerts');

      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
        this.eventsSubject.next([...this.events]);
      }

      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
        this.alertsSubject.next([...this.alerts]);
      }
    } catch (error) {
      console.error('Error cargando datos de seguridad almacenados:', error);
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem('security_events', JSON.stringify(this.events));
      localStorage.setItem('security_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Error persistiendo datos de seguridad:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private maskEmail(email: string): string {
    if (!email || email === 'unknown') return email;
    
    const [localPart, domain] = email.split('@');
    if (!domain) return '***';
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : '**';
    
    return `${maskedLocal}@${domain}`;
  }

  private getClientIP(): string {
    // En un entorno real, esto se obtendría del servidor
    return 'client-side';
  }
}