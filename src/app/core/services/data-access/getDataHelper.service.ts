// supabase-helper.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class getDataHelperService {
  private supabase: SupabaseClient = createClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_KEY
  );

  get client() {
    return this.supabase;
  }

  async getData<T>(
    table: string,
    select: string,
    filterKey?: string,
    filterValue?: any,
    single: boolean = false
  ): Promise<{ data: T | null; error: any }> {
    let query = this.supabase.from(table).select(select);

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
