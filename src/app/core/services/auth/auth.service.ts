import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ConfirmationGuard } from '../../guards/confirmation.guard';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static supabaseInstance: SupabaseClient | null = null;
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  constructor(private router: Router) {
    // Usar singleton para evitar múltiples instancias
    if (!AuthService.supabaseInstance) {
      AuthService.supabaseInstance = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
    }
    this.supabase = AuthService.supabaseInstance;
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación y escucha cambios de estado
   */
  private async initializeAuth(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.sessionSubject.next(session);
    this.currentUserSubject.next(session?.user ?? null);

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user ?? null);
      
      // Manejar confirmación de email
      if (event === 'SIGNED_IN' && session?.user) {
        await this.handleEmailConfirmation();
      }
    });
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
    return this.getCurrentUser() !== null;
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
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
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Registra un nuevo usuario con rol por defecto
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
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
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      this.router.navigate(['/home']);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al cerrar sesión' };
    }
  }

  /**
   * Restablece la contraseña del usuario
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
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

      // Nota: Supabase no tiene un método directo para eliminar usuarios desde el cliente
      // Esto normalmente se haría desde el servidor o usando RPC
      const { error } = await this.supabase.rpc('delete_user_account');
      
      if (error) {
        return { success: false, error: error.message };
      }

      await this.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar la cuenta' };
    }
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getUserRole(): string {
    const user = this.getCurrentUser();
    return user?.user_metadata?.['role'] || 'user';
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
      const { error } = await this.supabase.auth.updateUser({
        phone: data.phone,
        data: {
          full_name: `${data.firstName} ${data.lastName}`.trim(),
          gender: data.gender
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al actualizar los datos' };
    }
  }

  /**
   * Verifica si el usuario es admin
   */
  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  /**
   * Actualiza el rol de un usuario (solo admins)
   */
  async updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAdmin()) {
        return { success: false, error: 'No tienes permisos para cambiar roles' };
      }

      const { error } = await this.supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al actualizar rol' };
    }
  }

  /**
   * Obtiene el cliente de Supabase autenticado
   */
  getAuthenticatedClient() {
    return this.supabase;
  }
}
