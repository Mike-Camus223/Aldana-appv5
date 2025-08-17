// supabase-helper.service.ts
import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class getDataHelperService {
  constructor(private authService: AuthService) {}

  get client() {
    // Usar siempre el cliente del AuthService para evitar múltiples instancias
    return this.authService.getAuthenticatedClient();
  }

  // Método para operaciones que requieren autenticación
  async insertWithAuth<T>(
    table: string,
    data: any,
    select?: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      // Usar el cliente autenticado del AuthService
      const authenticatedClient = this.authService.getAuthenticatedClient();
      
      // Verificar sesión del cliente autenticado
      const { data: { session } } = await authenticatedClient.auth.getSession();
      
      console.log('🔍 Session check (AuthService client):', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        accessToken: session?.access_token ? 'Present' : 'Missing'
      });
      
      if (!session) {
        return { data: null, error: { message: 'No hay sesión activa' } };
      }

      if (select) {
        const { data: insertData, error } = await authenticatedClient
          .from(table)
          .insert(data)
          .select(select)
          .single();
        
        console.log('📝 Insert result:', { 
          success: !error, 
          error: error?.message,
          data: insertData 
        });
        
        return { data: error ? null : (insertData as T), error };
      } else {
        const { data: insertData, error } = await authenticatedClient
          .from(table)
          .insert(data);
        
        console.log('📝 Insert result:', { 
          success: !error, 
          error: error?.message,
          data: insertData 
        });
        
        return { data: error ? null : (insertData as T), error };
      }
    } catch (error) {
      console.error('❌ Exception in insertWithAuth:', error);
      return { data: null, error };
    }
  }

  async getData<T>(
    table: string,
    select: string,
    filterKey?: string,
    filterValue?: any,
    single: boolean = false
  ): Promise<{ data: T | null; error: any }> {
    let query = this.client.from(table).select(select);

    if (filterKey && filterValue !== undefined) {
      query = query.eq(filterKey, filterValue);
    }

    const result = single ? await query.single() : await query;

    return {
      data: result.error ? null : (result.data as T),
      error: result.error,
    };
  }
}
