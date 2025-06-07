
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment'; // Ajusta ruta según tu estructura

@Injectable({
  providedIn: 'root'
})
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

  if (error) {
    console.error('SupabaseService getProducts error: ', error);
    return { data: null, error };
  }

  return { data, error: null };
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
    .contains('colors', [color]); // Requiere que colors sea tipo text[]

  if (error) {
    console.error('SupabaseService getProductsByColor error:', error.message);
    return { data: null, error };
  }

  return { data, error: null };
}


  // Otros métodos si tienes...
}
