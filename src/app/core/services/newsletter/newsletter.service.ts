import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from '../data-access/supabase.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../../environments/environment';

export interface SubscriberRecord {
  id: string;
  user_id?: string | null;
  email: string;
  is_active: boolean;
  source: string;
  created_at: string;
  unsubscribed_at?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  private isSubscribedSubject = new BehaviorSubject<boolean>(false);
  isSubscribed$: Observable<boolean> = this.isSubscribedSubject.asObservable();

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      if (user?.email) {
        this.checkSubscriptionStatus(user.email);
      } else {
        this.isSubscribedSubject.next(false);
      }
    });
  }

  /**
   * Consulta si un email está suscrito activamente usando RPC seguro
   */
  async checkSubscriptionStatus(email?: string): Promise<boolean> {
    try {
      const targetEmail = email || this.authService.getCurrentUser()?.email;
      if (!targetEmail) {
        this.isSubscribedSubject.next(false);
        return false;
      }

      const { data, error } = await this.supabaseService.client.rpc('get_newsletter_status', {
        p_email: targetEmail.trim().toLowerCase()
      });

      if (error) {
        console.warn('Error al verificar suscripción a newsletter:', error);
        return false;
      }

      const isSubscribed = !!data?.is_subscribed;
      this.isSubscribedSubject.next(isSubscribed);
      return isSubscribed;
    } catch (e) {
      return false;
    }
  }

  /**
   * Suscribe un email (usuario autenticado o visitante) usando RPC seguro
   */
  async subscribe(
    email?: string,
    source: string = 'panel_usuario',
    sendWelcomeEmail: boolean = false
  ): Promise<{ success: boolean; alreadySubscribed?: boolean; error?: string }> {
    try {
      const currentUser = this.authService.getCurrentUser();
      const targetEmail = (email || currentUser?.email || '').trim().toLowerCase();

      if (!targetEmail) {
        return { success: false, error: 'No se especificó un correo electrónico válido' };
      }

      const { data, error } = await this.supabaseService.client.rpc('subscribe_newsletter', {
        p_email: targetEmail,
        p_source: source,
        p_user_id: currentUser?.id || null
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const isSubscribed = !!data?.is_active;
      const alreadySubscribed = !!data?.already_subscribed;
      this.isSubscribedSubject.next(isSubscribed);

      if (sendWelcomeEmail && !alreadySubscribed) {
        this.sendWelcomeDiscountEmail(targetEmail).catch(err => console.warn('Info: Intento de email de bienvenida ejecutado:', err));
      }

      return { success: true, alreadySubscribed: alreadySubscribed };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error inesperado al suscribir' };
    }
  }

  /**
   * Cancela la suscripción de un email usando RPC seguro
   */
  async unsubscribe(email?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const targetEmail = (email || this.authService.getCurrentUser()?.email || '').trim().toLowerCase();
      if (!targetEmail) {
        return { success: false, error: 'No se especificó un correo electrónico' };
      }

      const { data, error } = await this.supabaseService.client.rpc('unsubscribe_newsletter', {
        p_email: targetEmail
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.isSubscribedSubject.next(false);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error al cancelar suscripción' };
    }
  }

  /**
   * Envía un email de bienvenida con código de descuento usando Edge Function
   */
  async sendWelcomeDiscountEmail(toEmail: string, discountCode: string = 'BIENVENIDO10'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${environment.SUPABASE_URL}/functions/v1/send-newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': environment.SUPABASE_KEY
        },
        body: JSON.stringify({
          action: 'welcome_discount',
          to: toEmail,
          discountCode: discountCode,
          discountPercent: '10%'
        })
      });

      const resJson = await response.json();
      return { success: resJson.success, error: resJson.error };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al conectar con la Edge Function' };
    }
  }
}
