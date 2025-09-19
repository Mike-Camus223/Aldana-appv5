import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ConfirmationGuard } from '../../guards/confirmation.guard';
import { isPlatformBrowser } from '@angular/common';
import { createSupabaseClient } from '../supabase/supabase-ssr.config';

interface LoginAttempt {
  email: string;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockUntil?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static supabaseInstance: SupabaseClient | null = null;
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private sessionTimeoutSubscription?: Subscription;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  // Security configurations
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos
  private readonly SESSION_TIMEOUT_WARNING = 5 * 60 * 1000; // 5 minutos antes de expirar
  private readonly SESSION_CHECK_INTERVAL = 60 * 1000; // Verificar cada minuto
  private readonly LOGIN_ATTEMPTS_KEY = 'auth_login_attempts';

  constructor(private router: Router) {
    // Usar singleton para evitar múltiples instancias
    if (!AuthService.supabaseInstance) {
      AuthService.supabaseInstance = createSupabaseClient();
    }
    this.supabase = AuthService.supabaseInstance;
    
    // Solo inicializar auth en el navegador o con cuidado en SSR
    if (this.isBrowser) {
      this.initializeAuth();
    } else {
      // En el servidor, inicializar con cuidado (sin listeners ni timers)
      this.initializeAuthSSR();
    }
  }
  
  /**
   * Versión segura para SSR de la inicialización de autenticación
   */
  private async initializeAuthSSR(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user ?? null);
      // No iniciar timers ni listeners en SSR
    } catch (error) {
      console.error('Error initializing auth in SSR:', error);
    }
  }

  /**
   * Inicializa la autenticación y escucha cambios de estado
   */
  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user ?? null);
      
      if (session) {
        this.startSessionMonitoring(session);
        this.logSecurityEvent('SESSION_INITIALIZED', session.user?.email || 'unknown');
      }

      this.supabase.auth.onAuthStateChange(async (event, session) => {
        
        this.sessionSubject.next(session);
        this.currentUserSubject.next(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          this.startSessionMonitoring(session);
          this.logSecurityEvent('USER_SIGNED_IN', session.user.email);
          await this.handleEmailConfirmation();
        } else if (event === 'SIGNED_OUT') {
          this.stopSessionMonitoring();
          this.logSecurityEvent('USER_SIGNED_OUT', 'unknown');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          this.logSecurityEvent('TOKEN_REFRESHED', session.user?.email || 'unknown');
          this.startSessionMonitoring(session); // Reiniciar monitoreo con nueva sesión
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.logSecurityEvent('AUTH_INIT_ERROR', 'unknown', { error: (error as Error).message });
    }
  }

  /**
   * Inicia el monitoreo de la sesión para timeout automático
   */
  private startSessionMonitoring(session: Session): void {
    this.stopSessionMonitoring(); // Limpiar monitoreo anterior
    
    if (!session.expires_at) return;

    const expirationTime = new Date(session.expires_at * 1000);
    const currentTime = new Date();
    const timeUntilExpiry = expirationTime.getTime() - currentTime.getTime();
    const warningTime = timeUntilExpiry - this.SESSION_TIMEOUT_WARNING;
    // Programar advertencia de expiración
    if (warningTime > 0) {
      setTimeout(() => {
        this.handleSessionWarning();
      }, warningTime);
    }

    // Verificar periódicamente el estado de la sesión
    this.sessionTimeoutSubscription = timer(0, this.SESSION_CHECK_INTERVAL).subscribe(() => {
      this.checkSessionValidity();
    });
  }

  /**
   * Detiene el monitoreo de la sesión
   */
  private stopSessionMonitoring(): void {
    if (this.sessionTimeoutSubscription) {
      this.sessionTimeoutSubscription.unsubscribe();
      this.sessionTimeoutSubscription = undefined;
    }
  }

  /**
   * Verifica la validez de la sesión actual
   */
  private checkSessionValidity(): void {
    const session = this.getCurrentSession();
    if (!session || !session.expires_at) return;

    const expirationTime = new Date(session.expires_at * 1000);
    const currentTime = new Date();

    if (currentTime >= expirationTime) {
      console.warn('Session expired, signing out automatically');
      this.logSecurityEvent('SESSION_AUTO_EXPIRED', session.user?.email || 'unknown');
      this.signOut();
    }
  }

  /**
   * Maneja la advertencia de expiración de sesión
   */
  private handleSessionWarning(): void {
    const session = this.getCurrentSession();
    if (!session) return;

    console.warn('Session will expire soon');
    this.logSecurityEvent('SESSION_EXPIRY_WARNING', session.user?.email || 'unknown');
    
    // Aquí podrías mostrar una notificación al usuario
    // Por ejemplo, usando un servicio de notificaciones
  }

  /**
   * Maneja la confirmación de email y redirige apropiadamente
   */
  private async handleEmailConfirmation(): Promise<void> {
    // Check if current URL has a confirmation token
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.get('type') === 'signup' && params.get('access_token')) {
      // Set confirmation state before redirecting
      ConfirmationGuard.setConfirmationState('register-success');
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Redirect to success page
      await this.router.navigate(['/register-success'], { 
        replaceUrl: true
      });
    }
  }

  /**
   * Observable del usuario actual
   */
  get currentUser$(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Observable de la sesión actual
   */
  get session$(): Observable<Session | null> {
    return this.sessionSubject.asObservable();
  }

  /**
   * Obtiene el usuario actual de forma síncrona
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene la sesión actual de forma síncrona
   */
  getCurrentSession(): Session | null {
    return this.sessionSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    const session = this.getCurrentSession();
    
    if (!user || !session) return false;
    
    // Verificar que la sesión no haya expirado
    if (session.expires_at) {
      const expirationTime = new Date(session.expires_at * 1000);
      const currentTime = new Date();
      
      if (currentTime >= expirationTime) {
        console.warn('Session expired in isAuthenticated check');
        return false;
      }
    }
    
    return true;
  }

  /**
   * Inicia sesión con email y contraseña con rate limiting
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar rate limiting
      if (this.isLoginBlocked(email)) {
        const blockInfo = this.getLoginAttempts(email);
        const remainingTime = blockInfo.blockUntil ? Math.ceil((blockInfo.blockUntil - Date.now()) / 1000 / 60) : 0;
        
        this.logSecurityEvent('LOGIN_BLOCKED_RATE_LIMIT', email, { 
          attempts: blockInfo.attempts,
          remainingMinutes: remainingTime 
        });
        
        return { 
          success: false, 
          error: `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime} minutos.` 
        };
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.recordFailedLogin(email);
        this.logSecurityEvent('LOGIN_FAILED', email, { error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Login exitoso, limpiar intentos fallidos
        this.clearLoginAttempts(email);
        this.logSecurityEvent('LOGIN_SUCCESS', email);
        
        // Redirigir según el rol del usuario
        const userRole = this.getUserRole();
        if (userRole === 'admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/panel-control']);
        }
        return { success: true };
      }

      return { success: false, error: 'Error desconocido al iniciar sesión' };
    } catch (error) {
      this.recordFailedLogin(email);
      this.logSecurityEvent('LOGIN_ERROR', email, { error: (error as Error).message });
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Registra un nuevo usuario con rol por defecto
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validaciones de seguridad básicas
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Email inválido' };
      }

      if (!this.isValidPassword(password)) {
        return { success: false, error: 'La contraseña debe tener al menos 8 caracteres' };
      }

      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user' // Rol por defecto
          }
        }
      });

      if (error) {
        this.logSecurityEvent('SIGNUP_FAILED', email, { error: error.message });
        return { success: false, error: error.message };
      }

      this.logSecurityEvent('SIGNUP_SUCCESS', email);
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('SIGNUP_ERROR', email, { error: (error as Error).message });
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      const userEmail = currentUser?.email || 'unknown';

      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        this.logSecurityEvent('SIGNOUT_FAILED', userEmail, { error: error.message });
        return { success: false, error: error.message };
      }

      this.stopSessionMonitoring();
      this.logSecurityEvent('SIGNOUT_SUCCESS', userEmail);
      this.router.navigate(['/home']);
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('SIGNOUT_ERROR', 'unknown', { error: (error as Error).message });
      return { success: false, error: 'Error al cerrar sesión' };
    }
  }

  /**
   * Verifica si un email está bloqueado por intentos fallidos
   */
  private isLoginBlocked(email: string): boolean {
    const attempts = this.getLoginAttempts(email);
    
    if (attempts.blocked && attempts.blockUntil) {
      if (Date.now() < attempts.blockUntil) {
        return true;
      } else {
        // Bloqueo expirado, limpiar
        this.clearLoginAttempts(email);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Registra un intento de login fallido
   */
  private recordFailedLogin(email: string): void {
    try {
      const attempts = this.getLoginAttempts(email);
      const now = Date.now();
      
      attempts.attempts++;
      attempts.lastAttempt = now;
      
      if (attempts.attempts === 1) {
        attempts.firstAttempt = now;
      }
      
      // Bloquear si excede el límite
      if (attempts.attempts >= this.MAX_LOGIN_ATTEMPTS) {
        attempts.blocked = true;
        attempts.blockUntil = now + this.LOGIN_BLOCK_DURATION;
        
        this.logSecurityEvent('LOGIN_ACCOUNT_BLOCKED', email, {
          attempts: attempts.attempts,
          blockDuration: this.LOGIN_BLOCK_DURATION / 1000 / 60
        });
      }
      
      this.saveLoginAttempts(email, attempts);
    } catch (error) {
      console.error('Error recording failed login:', error);
    }
  }

  /**
   * Obtiene los intentos de login para un email
   */
  private getLoginAttempts(email: string): LoginAttempt {
    try {
      const stored = localStorage.getItem(`${this.LOGIN_ATTEMPTS_KEY}_${email}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error getting login attempts:', error);
    }
    
    return {
      email,
      attempts: 0,
      firstAttempt: Date.now(),
      lastAttempt: Date.now(),
      blocked: false
    };
  }

  /**
   * Guarda los intentos de login
   */
  private saveLoginAttempts(email: string, attempts: LoginAttempt): void {
    try {
      localStorage.setItem(`${this.LOGIN_ATTEMPTS_KEY}_${email}`, JSON.stringify(attempts));
    } catch (error) {
      console.error('Error saving login attempts:', error);
    }
  }

  /**
   * Limpia los intentos de login para un email
   */
  private clearLoginAttempts(email: string): void {
    try {
      localStorage.removeItem(`${this.LOGIN_ATTEMPTS_KEY}_${email}`);
    } catch (error) {
      console.error('Error clearing login attempts:', error);
    }
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida fortaleza de contraseña
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Registra eventos de seguridad
   */
  private logSecurityEvent(event: string, userEmail: string | undefined, metadata?: any): void {
    const safeEmail = this.maskEmail(userEmail || 'unknown');
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userEmail: safeEmail,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getCurrentSession()?.access_token?.substring(0, 10) + '...',
      metadata
    };    
    // En producción, enviar a servicio de monitoreo
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        custom_parameter_1: safeEmail,
        custom_parameter_2: metadata ? JSON.stringify(metadata) : '',
        custom_parameter_3: 'auth_service'
      });
    }
  }

  /**
   * Enmascara email para logs
   */
  private maskEmail(email: string): string {
    if (!email || email === 'unknown') return email;
    
    const [localPart, domain] = email.split('@');
    if (!domain) return '***';
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
      : '**';
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getUserRole(): string {
    const user = this.getCurrentUser();
    return user?.user_metadata?.['role'] || 'user';
  }

  /**
   * Verifica si el usuario es admin
   */
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  /**
   * Obtiene el cliente de Supabase autenticado
   */
  getAuthenticatedClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Fuerza el refresh del token de acceso
   */
  async refreshToken(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        this.logSecurityEvent('TOKEN_REFRESH_FAILED', 'unknown', { error: error.message });
        return { success: false, error: error.message };
      }

      if (data.session) {
        this.logSecurityEvent('TOKEN_REFRESH_MANUAL_SUCCESS', data.session.user?.email || 'unknown');
        return { success: true };
      }

      return { success: false, error: 'No se pudo refrescar el token' };
    } catch (error) {
      this.logSecurityEvent('TOKEN_REFRESH_ERROR', 'unknown', { error: (error as Error).message });
      return { success: false, error: 'Error al refrescar token' };
    }
  }

  /**
   * Restablece la contraseña del usuario
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Email inválido' };
      }

      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        this.logSecurityEvent('PASSWORD_RESET_FAILED', email, { error: error.message });
        return { success: false, error: error.message };
      }

      this.logSecurityEvent('PASSWORD_RESET_SUCCESS', email);
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('PASSWORD_RESET_ERROR', email, { error: (error as Error).message });
      return { success: false, error: 'Error al enviar email de recuperación' };
    }
  }

  /**
   * Elimina la cuenta del usuario actual
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      this.logSecurityEvent('ACCOUNT_DELETION_ATTEMPT', user.email || 'unknown');

      // Nota: Supabase no tiene un método directo para eliminar usuarios desde el cliente
      // Esto normalmente se haría desde el servidor o usando RPC
      const { error } = await this.supabase.rpc('delete_user_account');
      
      if (error) {
        this.logSecurityEvent('ACCOUNT_DELETION_FAILED', user.email || 'unknown', { error: error.message });
        return { success: false, error: error.message };
      }

      this.logSecurityEvent('ACCOUNT_DELETION_SUCCESS', user.email || 'unknown');
      await this.signOut();
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('ACCOUNT_DELETION_ERROR', 'unknown', { error: (error as Error).message });
      return { success: false, error: 'Error al eliminar la cuenta' };
    }
  }

  /**
   * Actualiza los datos del usuario actual
   */
  async updateUserData(data: { 
    firstName: string;
    lastName: string;
    phone: string;
    gender: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      const { error } = await this.supabase.auth.updateUser({
        phone: data.phone,
        data: {
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          gender: data.gender
        }
      });

      if (error) {
        this.logSecurityEvent('USER_DATA_UPDATE_FAILED', currentUser.email || 'unknown', { error: error.message });
        return { success: false, error: error.message };
      }

      this.logSecurityEvent('USER_DATA_UPDATE_SUCCESS', currentUser.email || 'unknown');
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('USER_DATA_UPDATE_ERROR', 'unknown', { error: (error as Error).message });
      return { success: false, error: 'Error al actualizar los datos' };
    }
  }

  /**
   * Actualiza el rol de un usuario (solo admins)
   */
  async updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      if (!this.isAdmin()) {
        this.logSecurityEvent('UNAUTHORIZED_ROLE_UPDATE_ATTEMPT', currentUser.email || 'unknown', { 
          targetUserId: userId, 
          attemptedRole: newRole 
        });
        return { success: false, error: 'No tienes permisos para cambiar roles' };
      }

      const { error } = await this.supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      });

      if (error) {
        this.logSecurityEvent('ROLE_UPDATE_FAILED', currentUser.email || 'unknown', { 
          error: error.message, 
          targetUserId: userId, 
          newRole 
        });
        return { success: false, error: error.message };
      }

      this.logSecurityEvent('ROLE_UPDATE_SUCCESS', currentUser.email || 'unknown', { 
        targetUserId: userId, 
        newRole 
      });
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('ROLE_UPDATE_ERROR', 'unknown', { 
        error: (error as Error).message, 
        targetUserId: userId, 
        newRole 
      });
      return { success: false, error: 'Error al actualizar rol' };
    }
  }
}
