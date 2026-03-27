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
      collection_id,
      main_image,
      additional_images,
      sizes,
      slug,
      avid,
      color_id,
      color_name,
      color_hex,
      categories:pbrides_categories!pbrides_products_category_id_fkey (
        id,
        name
      ),
      subcategories:pbrides_subcategories!pbrides_products_subcategory_id_fkey (
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
      product_variants (
        id,
        color_id,
        color_name,
        color_hex,
        avid,
        main_image,
        additional_images,
        colors:pbrides_colors!pbrides_product_variants_color_id_fkey (
          code,
          name,
          hex
        )
      ),
      collection:collection_brides!pbrides_collection_id_fkey (
        id,
        name,
        slug,
        cover_image_url,
        season,
        release_date
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
      additional_images,
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
      slug,
      collection_media_brides (
        id,
        section_name,
        media_url,
        alt,
        type,
        order,
        poster_url
      )
    `;

    return this.helper.getData<any>('collection_brides', selectFields);
  }

}
