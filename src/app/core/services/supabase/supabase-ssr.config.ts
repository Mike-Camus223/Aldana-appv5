import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

export function createSupabaseClient() {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const options = {
    auth: {
      persistSession: isBrowser, 
      autoRefreshToken: isBrowser, 
      detectSessionInUrl: isBrowser, 
    },
    global: {
      fetch: fetch, 
    }
  };

  return createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY, options);
}