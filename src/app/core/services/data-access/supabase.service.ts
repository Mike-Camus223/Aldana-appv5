import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  private async getData<T>(
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

  async getContentForPages<T>(slug: string): Promise<T | null> {
    const result = await this.getData<T>(
      'generic_data_pages',
      `
      id,
      page_slug,
      generic_data_sections (
        id,
        section_order,
        generic_data_contents (
          id,
          content_type,
          content_order,
          content_text,
          image_url,
          video_url,
          is_main
        )
      )
    `,
      'page_slug',
      slug,
      true
    );
    return result.data;
  }



  async getProducts(id?: string) {
    const selectProducts = `
      id,
      name,
      description,
      details,
      category,
      price,
      product_variants (
        id,
        color,
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
    `;

    return this.getData<any>(
      'products',
      selectProducts,
      id ? 'id' : undefined,
      id,
      Boolean(id)
    );
  }
}
