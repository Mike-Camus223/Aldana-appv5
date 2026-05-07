import { inject, Injectable } from '@angular/core';
import { getDataHelperService } from '../getDataHelper.service';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
      private dataHelper = inject(getDataHelperService)
  
  constructor() { }

  async getAllCollections() {
    const selectFields = `
      id,
      uuid,
      name,
      cover_image_url,
      season,
      release_date,
      created_at,
      banner,
      description,
      slug
    `;

    const result = await this.dataHelper.getData<any[]>(
      'collections',
      selectFields
    );

    if (result.error) throw result.error;
    return result.data;
  }

  async getCollectionBySlug(slug: string) {
    const selectFields = `
      id,
      uuid,
      name,
      cover_image_url,
      season,
      release_date,
      created_at,
      banner,
      description,
      slug
    `;

    const result = await this.dataHelper.getData<any>(
      'collections',
      selectFields,
      'slug',
      slug,
      true
    );

    if (result.error) throw result.error;
    return result.data;
  }

  // Back-compat: antes se llamaba getCollectionById(slug)
  async getCollectionById(slug: string) {
    return this.getCollectionBySlug(slug);
  }

  async getCollectionItemsByCollectionId(collectionId: string) {
    const { data, error } = await this.dataHelper.client
      .from('product_collections')
      .select(`
        id,
        product_id,
        collection_id,
        display_order,
        products (
          id,
          name,
          slug,
          description,
          details,
          main_image,
          media,
          price
        )
      `)
      .eq('collection_id', collectionId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as any[];
  }

  async getCollectionItemDetail(collectionId: string, productSlug: string) {
    const { data, error } = await this.dataHelper.client
      .from('product_collections')
      .select(`
        id,
        product_id,
        collection_id,
        products!inner (
          id,
          name,
          slug,
          description,
          details,
          main_image,
          media,
          price,
          product_variants (
            id,
            color_name,
            color_hex,
            avid,
            main_image,
            media
          )
        )
      `)
      .eq('collection_id', collectionId)
      .eq('products.slug', productSlug)
      .single();

    if (error) throw error;
    return data as any;
  }
}
