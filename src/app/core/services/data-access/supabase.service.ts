import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }


   async getProducts(id?: string) {
    const query = this.supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        details,
        category,
        product_variants (
          id,
          color,
          price,
          product_images!product_images_variant_id_fkey (
            id,
            image_url,
            is_main
          ),
          product_sizes!product_sizes_variant_id_fkey (
            id,
            size
          )
        )
      `);

    if (id) {
      const { data, error } = await query.eq('id', id).single();
      return { data: error ? null : data, error };
    } else {
      const { data, error } = await query;
      return { data: error ? null : data, error };
    }
  }

  
}
