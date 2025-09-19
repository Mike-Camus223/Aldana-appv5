import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export function createSupabaseClient() {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Configuración específica para SSR
  const options = {
    auth: {
      persistSession: isBrowser, // Solo persistir sesión en el navegador
      autoRefreshToken: isBrowser, // Solo refrescar token en el navegador
      detectSessionInUrl: isBrowser, // Solo detectar sesión en URL en el navegador
    },
    global: {
      fetch: fetch, // Usar fetch global
    }
  };

  return createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY, options);
}