import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  async getProducts() {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,
        product_variants (
          id,
          color,
          price,
          product_images!product_images_variant_id_fkey (
            id,
            image_url,
            is_main
          )
        )
      `);

    return { data: error ? null : data, error };
  }

  async getProductsByColor(color: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        colors,
        product_images (
          id,
          product_id,
          url,
          is_main
        )
      `)
      .contains('colors', [color]);

    return { data: error ? null : data, error };
  }
}
