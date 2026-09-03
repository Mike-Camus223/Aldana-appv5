import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DatabaseClientService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.SUPABASE_URL,
      environment.SUPABASE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    );
  }

  async subscribeEmail(email: string, origin: string) {
    const { data, error } = await this.supabase
      .from('newsletter_subscribers')
      .insert({
        email,
        origin,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  }

  get key(): string {
    return environment.SUPABASE_KEY;
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}

// Alias para compatibilidad hacia atrás
export { DatabaseClientService as SupabaseService };