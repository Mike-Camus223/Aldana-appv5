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
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private authInitializedSubject = new BehaviorSubject<boolean>(false);
  public authInitialized$ = this.authInitializedSubject.asObservable();
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
    this.supabase = createSupabaseClient();

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
      this.authInitializedSubject.next(true);
      // No iniciar timers ni listeners en SSR
    } catch (error) {
      console.error('Error initializing auth in SSR:', error);
      this.authInitializedSubject.next(true);
    }
  }

  /**
   * Carga el perfil del usuario desde public.profiles y lo combina con el usuario sincronizando cooldown
   */
  async loadUserProfile(user: User): Promise<User> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        const now = new Date();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        let changeCount = profile.avatar_change_count || 0;
        let cooldownUntil = profile.avatar_cooldown_until;

        // Si el cooldown expiró o ya pasaron 7 días desde el último cambio, reiniciar ciclo a 0 consumidos
        if (cooldownUntil && new Date(cooldownUntil) <= now) {
          cooldownUntil = null;
          changeCount = 0;
        } else if (profile.avatar_updated_at && (now.getTime() - new Date(profile.avatar_updated_at).getTime() >= SEVEN_DAYS_MS)) {
          changeCount = 0;
          cooldownUntil = null;
        }

        user.user_metadata = {
          ...(user.user_metadata || {}),
          full_name: profile.full_name || user.user_metadata?.['full_name'],
          phone: profile.phone || user.user_metadata?.['phone'],
          gender: profile.gender || user.user_metadata?.['gender'],
          avatar_url: profile.avatar_url || user.user_metadata?.['avatar_url'] || user.user_metadata?.['picture'],
          custom_avatar_url: profile.avatar_url,
          avatar_updated_at: profile.avatar_updated_at,
          avatar_change_count: changeCount,
          avatar_cooldown_until: cooldownUntil
        };
      }
      return user;
    } catch (e) {
      return user;
    }
  }

  /**
   * Inicializa la autenticación y escucha cambios de estado
   */
  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();

      this.sessionSubject.next(session);
      
      if (session?.user) {
        const enrichedUser = await this.loadUserProfile(session.user);
        this.currentUserSubject.next(enrichedUser);
        this.startSessionMonitoring(session);
        this.logSecurityEvent('SESSION_INITIALIZED', session.user?.email || 'unknown');
      } else {
        this.currentUserSubject.next(null);
      }

      this.authInitializedSubject.next(true);

      this.supabase.auth.onAuthStateChange(async (event, session) => {
        this.sessionSubject.next(session);

        if (session?.user) {
          const enrichedUser = await this.loadUserProfile(session.user);
          this.currentUserSubject.next(enrichedUser);
        } else {
          this.currentUserSubject.next(null);
        }

        if (event === 'SIGNED_IN' && session?.user) {
          this.startSessionMonitoring(session);
          this.logSecurityEvent('USER_SIGNED_IN', session.user.email);
          await this.handleEmailConfirmation();

          if (this.isBrowser) {
            const currentPath = window.location.pathname;
            if (currentPath.startsWith('/cuenta') || currentPath.includes('iniciar-sesion') || currentPath.includes('login') || window.location.hash.includes('access_token')) {
              this.router.navigate(['/panel/panel-control']);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          this.stopSessionMonitoring();
          this.logSecurityEvent('USER_SIGNED_OUT', 'unknown');
          this.router.navigate(['/cuenta/iniciar-sesion']);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          this.logSecurityEvent('TOKEN_REFRESHED', session.user?.email || 'unknown');
          this.startSessionMonitoring(session); // Reiniciar monitoreo con nueva sesión
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.logSecurityEvent('AUTH_INIT_ERROR', 'unknown', { error: (error as Error).message });
      this.authInitializedSubject.next(true);
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

    // Verificar periódicamente el estado de la sesión (después del primer intervalo)
    this.sessionTimeoutSubscription = timer(this.SESSION_CHECK_INTERVAL, this.SESSION_CHECK_INTERVAL).subscribe(() => {
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
   * Verifica la validez de la sesión actual y refresca si es necesario
   */
  private async checkSessionValidity(): Promise<void> {
    const session = this.getCurrentSession();
    if (!session || !session.expires_at) return;

    const expirationTime = new Date(session.expires_at * 1000);
    const currentTime = new Date();

    if (currentTime >= expirationTime) {
      try {
        const { data, error } = await this.supabase.auth.refreshSession();
        if (error || !data.session) {
          this.stopSessionMonitoring();
          this.sessionSubject.next(null);
          this.currentUserSubject.next(null);
        } else {
          this.sessionSubject.next(data.session);
          this.currentUserSubject.next(data.session.user ?? null);
        }
      } catch (err) {
        this.stopSessionMonitoring();
        this.sessionSubject.next(null);
        this.currentUserSubject.next(null);
      }
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
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    // Buscar en ambos lugares (query params y hash)
    const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
    const type = searchParams.get('type') || hashParams.get('type');

    if (type === 'signup' && accessToken) {
      // Set confirmation state before redirecting
      ConfirmationGuard.setConfirmationState('registro-exitoso');

      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Redirect to success page
      await this.router.navigate(['/registro-exitoso'], {
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

        // Redirigir al panel del usuario
        this.router.navigate(['/panel/panel-control']);
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
          data: { role: 'user' },
          emailRedirectTo: `${window.location.origin}/registro-exitoso`
        }
      });

      if (error) {
        this.logSecurityEvent('SIGNUP_FAILED', email, { error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        this.logSecurityEvent('SIGNUP_SUCCESS', email);

        ConfirmationGuard.setConfirmationState('confirmar-registro');

        // Log de depuración
        console.log('AuthService - Confirmation state set for confirmar-registro');
        console.log('AuthService - Navigating to /confirmar-registro');

        await this.router.navigate(['/confirmar-registro'], { replaceUrl: true });

        return { success: true };
      }

      // Caso raro: no hay error pero tampoco hay user
      return { success: false, error: 'Error desconocido al registrar usuario' };

    } catch (error) {
      this.logSecurityEvent('SIGNUP_ERROR', email, { error: (error as Error).message });
      return { success: false, error: 'Error de conexión' };
    }
  }

  // authrapidobyproviders //
  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
    await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/panel/panel-control`
      }
    });
  }
  /**
   * Cierra la sesión del usuario de forma segura sin bucles
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      const userEmail = currentUser?.email || 'unknown';

      // 1. Limpiar estado local y monitoreo de inmediato
      this.stopSessionMonitoring();
      this.sessionSubject.next(null);
      this.currentUserSubject.next(null);

      // 2. Intentar invalidar en Supabase sin propagar error si ya expiró
      try {
        await this.supabase.auth.signOut();
      } catch (err) {
        // Silencioso si la sesión ya no existía en el backend (403/404)
      }

      this.logSecurityEvent('SIGNOUT_SUCCESS', userEmail);
      await this.router.navigate(['/cuenta/iniciar-sesion']);
      return { success: true };
    } catch (error) {
      this.stopSessionMonitoring();
      this.sessionSubject.next(null);
      this.currentUserSubject.next(null);
      await this.router.navigate(['/cuenta/iniciar-sesion']);
      return { success: true };
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
      // VERIFICAR SI ESTÁ EN BROWSER
      if (!this.isBrowser) {
        return {
          email,
          attempts: 0,
          firstAttempt: Date.now(),
          lastAttempt: Date.now(),
          blocked: false
        };
      }
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
      userAgent: this.isBrowser ? navigator.userAgent : 'server',
      url: this.isBrowser ? window.location.href : 'server',
      sessionId: this.getCurrentSession()?.access_token?.substring(0, 10) + '...',
      metadata
    };

    // Solo ejecutar gtag en browser
    if (this.isBrowser && typeof window !== 'undefined' && (window as any).gtag) {
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
   * Actualiza los datos del usuario actual y sincroniza la columna de teléfono en Supabase
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

      const cleanPhone = data.phone?.trim() || '';
      const fullName = `${data.firstName} ${data.lastName}`.trim();

      // Guardar en metadata (JSONB)
      const metadata: Record<string, any> = {
        full_name: fullName,
        gender: data.gender,
        phone: cleanPhone
      };

      // Formatear a E.164 para la columna nativa auth.users.phone
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      let e164Phone: string | undefined = undefined;

      if (digitsOnly.length >= 6 && digitsOnly.length <= 15) {
        if (cleanPhone.startsWith('+')) {
          e164Phone = '+' + digitsOnly;
        } else if (digitsOnly.startsWith('54')) {
          e164Phone = '+' + digitsOnly;
        } else {
          // Por defecto código de país de Argentina (+54)
          e164Phone = '+54' + digitsOnly;
        }
      }

      let updatedData: any = null;

      // Intentar actualizar con el campo phone si es válido
      if (e164Phone) {
        const res = await this.supabase.auth.updateUser({
          phone: e164Phone,
          data: metadata
        });

        if (res.error) {
          console.warn('Advertencia al sincronizar columna phone en Supabase, reintentando con metadata:', res.error.message);
          // Si Supabase rechaza el formato phone raíz, actualizar metadata
          const fallbackRes = await this.supabase.auth.updateUser({ data: metadata });
          if (fallbackRes.error) {
            return { success: false, error: fallbackRes.error.message };
          }
          updatedData = fallbackRes.data;
        } else {
          updatedData = res.data;
        }
      } else {
        const res = await this.supabase.auth.updateUser({ data: metadata });
        if (res.error) {
          return { success: false, error: res.error.message };
        }
        updatedData = res.data;
      }

      // 2. Persistir en la tabla public.profiles de Supabase
      try {
        await this.supabase.from('profiles').upsert({
          id: currentUser.id,
          email: currentUser.email,
          full_name: fullName,
          phone: cleanPhone,
          gender: data.gender,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Error al guardar en tabla profiles:', err);
      }

      if (updatedData?.user) {
        const enrichedUser = await this.loadUserProfile(updatedData.user);
        this.currentUserSubject.next(enrichedUser);
      }

      this.logSecurityEvent('USER_DATA_UPDATE_SUCCESS', currentUser.email || 'unknown');
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('USER_DATA_UPDATE_ERROR', 'unknown', { error: (error as Error).message });
      return { success: false, error: 'Error al actualizar los datos' };
    }
  }

  /**
   * Comprime y recorta la imagen a formato WebP optimizado (400x400 px)
   */
  async compressAvatar(file: File): Promise<File> {
    return new Promise((resolve) => {
      try {
        if (typeof document === 'undefined') {
          resolve(file);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = 400;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(file);
              return;
            }

            const minDim = Math.min(img.width, img.height);
            const startX = (img.width - minDim) / 2;
            const startY = (img.height - minDim) / 2;

            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);

            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }));
              } else {
                resolve(file);
              }
            }, 'image/webp', 0.85);
          };
          img.onerror = () => resolve(file);
          img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      } catch {
        resolve(file);
      }
    });
  }

  /**
   * Sube una imagen de avatar a Supabase Storage con compresión WebP, cooldown y reemplazo de 1 solo archivo
   */
  async uploadAvatar(file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      // Validar tipo permitido
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        return { success: false, error: 'Formato no soportado. Usa JPG, PNG o WEBP' };
      }

      // Validar tamaño máximo antes de compresión (máx 5MB)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        return { success: false, error: 'La imagen supera los 5MB permitidos' };
      }

      // 1. Verificar Cooldown y Límites de Cambio en Supabase
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('avatar_updated_at, avatar_change_count, avatar_cooldown_until')
        .eq('id', currentUser.id)
        .maybeSingle();

      const now = new Date();
      if (profile?.avatar_cooldown_until) {
        const cooldownDate = new Date(profile.avatar_cooldown_until);
        if (cooldownDate > now) {
          const formattedDate = cooldownDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return {
            success: false,
            error: `Has alcanzado el límite de 4 cambios de foto. Podrás volver a actualizarla el ${formattedDate}.`
          };
        }
      }

      // Calcular contador y cooldown (4 cambios por período de 7 días)
      let changeCount = 1;
      let cooldownUntil: string | null = null;
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

      if (profile?.avatar_updated_at) {
        const lastUpdate = new Date(profile.avatar_updated_at).getTime();
        if (now.getTime() - lastUpdate < SEVEN_DAYS_MS) {
          changeCount = (profile.avatar_change_count || 0) + 1;
          if (changeCount >= 4) {
            cooldownUntil = new Date(now.getTime() + SEVEN_DAYS_MS).toISOString();
          }
        }
      }

      // 2. Compresión automática del lado del cliente a WebP (400x400)
      const compressedFile = await this.compressAvatar(file);

      // 3. Ruta única por usuario (Estrategia: 1 usuario = 1 archivo en Storage, sobreescritura automática)
      const filePath = `avatars/avatar_${currentUser.id}.webp`;

      const { error: uploadError } = await this.supabase.storage
        .from('aldana-app')
        .upload(filePath, compressedFile, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error al subir avatar a Storage:', uploadError);
        return { success: false, error: uploadError.message || 'Error al subir archivo' };
      }

      // 4. Obtener URL pública con parámetro de timestamp para invalidar caché local del navegador
      const { data: urlData } = this.supabase.storage
        .from('aldana-app')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // 5. Persistir en la tabla public.profiles de Supabase
      try {
        await this.supabase.from('profiles').upsert({
          id: currentUser.id,
          email: currentUser.email,
          avatar_url: publicUrl,
          avatar_updated_at: now.toISOString(),
          avatar_change_count: changeCount,
          avatar_cooldown_until: cooldownUntil,
          updated_at: now.toISOString()
        });
      } catch (err) {
        console.warn('Error al actualizar avatar en tabla profiles:', err);
      }

      // 6. Actualizar metadatos del usuario en Supabase Auth
      const { data: updatedData } = await this.supabase.auth.updateUser({
        data: {
          custom_avatar_url: publicUrl,
          avatar_url: publicUrl,
          picture: publicUrl
        }
      });

      if (updatedData?.user) {
        const enrichedUser = await this.loadUserProfile(updatedData.user);
        this.currentUserSubject.next(enrichedUser);
      }

      this.logSecurityEvent('AVATAR_UPDATE_SUCCESS', currentUser.email || 'unknown');
      return { success: true, avatarUrl: publicUrl };
    } catch (error: any) {
      console.error('Error en uploadAvatar:', error);
      return { success: false, error: error.message || 'Error inesperado al subir avatar' };
    }
  }

  /**
   * Elimina la foto de perfil del usuario actual, borrando el archivo físico del Storage y limpiando la BD
   */
  async removeAvatar(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      // 1. Borrar archivo físico de Supabase Storage para liberar espacio
      try {
        await this.supabase.storage
          .from('aldana-app')
          .remove([`avatars/avatar_${currentUser.id}.webp`]);
      } catch (storageErr) {
        console.warn('Advertencia al borrar archivo del Storage:', storageErr);
      }

      // 2. Limpiar en la tabla profiles
      try {
        await this.supabase.from('profiles').update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        }).eq('id', currentUser.id);
      } catch (err) {
        console.warn('Error al eliminar avatar en profiles:', err);
      }

      // 3. Limpiar en auth.users
      const { data: updatedData, error } = await this.supabase.auth.updateUser({
        data: {
          custom_avatar_url: null,
          avatar_url: null,
          picture: null
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (updatedData?.user) {
        const enrichedUser = await this.loadUserProfile(updatedData.user);
        this.currentUserSubject.next(enrichedUser);
      }

      this.logSecurityEvent('AVATAR_REMOVE_SUCCESS', currentUser.email || 'unknown');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al eliminar avatar' };
    }
  }
}
