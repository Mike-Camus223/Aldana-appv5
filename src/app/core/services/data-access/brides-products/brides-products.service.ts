import { Injectable } from '@angular/core';
import { getDataHelperService } from '../getDataHelper.service';
import { SupabaseService } from '../supabase.service';

@Injectable({
  providedIn: 'root'
})
export class BridesProductsService {

  constructor(
    private supabaseService: SupabaseService,
    private helper: getDataHelperService
  ) {}

  /**
   * Obtener todos los productos de vestidos de novia
   * o uno específico por slug
   */
  async getProducts(slug?: string) {
    const selectFields = `
      id,
      name,
      description,
      details,
      price,
      category_id,
      subcategory_id,
      main_image,
      media,
      sizes,
      slug,
      avid,
      color_id,
      color_name,
      color_hex,
      categories:pbrides_categories (
        id,
        name
      ),
      subcategories:pbrides_subcategories (
        id,
        name
      ),
      product_collections:pbrides_product_collections (
        collection_id,
        collections:collection_brides (
          id,
          name,
          slug
        )
      ),
      product_variants:pbrides_product_variants (
        id,
        color_id,
        color_name,
        color_hex,
        avid,
        main_image,
        media
      )
    `;

    // Usamos el helper para autenticación si fuese necesario
    return this.helper.getData<any>(
      'pbrides_products',
      selectFields,
      slug ? 'slug' : undefined,
      slug,
      Boolean(slug)
    );
  }

  /** Misma forma que getProducts(), para miniaturas en collection_brides_items. */
  async getProductsByIds(ids: string[]): Promise<any[]> {
    if (!ids.length) return [];
    const selectFields = `
      id,
      name,
      description,
      details,
      price,
      category_id,
      subcategory_id,
      main_image,
      media,
      sizes,
      slug,
      avid,
      color_id,
      color_name,
      color_hex,
      categories:pbrides_categories (
        id,
        name
      ),
      subcategories:pbrides_subcategories (
        id,
        name
      ),
      product_collections:pbrides_product_collections (
        collection_id,
        collections:collection_brides (
          id,
          name,
          slug
        )
      ),
      product_variants:pbrides_product_variants (
        id,
        color_id,
        color_name,
        color_hex,
        avid,
        main_image,
        media
      )
    `;
    const { data, error } = await this.helper.client
      .from('pbrides_products')
      .select(selectFields)
      .in('id', ids);
    if (error) throw error;
    return (data as any[]) ?? [];
  }

  /**
   * Obtener variantes de un producto específico
   */
  async getProductVariants(productId: string) {
    const selectFields = `
      id,
      color_id,
      color_name,
      color_hex,
      avid,
      main_image,
      media,
      colors:pbrides_colors!pbrides_product_variants_color_id_fkey (
        code,
        name,
        hex
      )
    `;

    return this.helper.getData<any>(
      'pbrides_product_variants',
      selectFields,
      'product_id',
      productId
    );
  }

  /**
   * Obtener colecciones de novias (para mostrar en galería)
   */
  async getCollections() {
    const selectFields = `
      id,
      uuid,
      name,
      cover_image_url,
      season,
      release_date,
      banner,
      description,
      slug
    `;

    return this.helper.getData<any>('collection_brides', selectFields);
  }

  async getCategories() {
    return this.helper.getData<any[]>('pbrides_categories', 'id, name');
  }

  async getSubcategories() {
    return this.helper.getData<any[]>('pbrides_subcategories', 'id, name, category_id');
  }

}
