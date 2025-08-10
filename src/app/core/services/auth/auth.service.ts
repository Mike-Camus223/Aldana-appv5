import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);

  constructor(private router: Router) {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
    this.initializeAuth();
  }

  /**
   * Inicializa la autenticación y escucha cambios de estado
   */
  private async initializeAuth(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.sessionSubject.next(session);
    this.currentUserSubject.next(session?.user ?? null);

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.sessionSubject.next(session);
      this.currentUserSubject.next(session?.user ?? null);
    });
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
        this.router.navigate(['/user-panel']);
        return { success: true };
      }

      return { success: false, error: 'Error desconocido al iniciar sesión' };
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
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
}
