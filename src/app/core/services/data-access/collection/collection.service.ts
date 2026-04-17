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
    const selectFields = `
      id,
      collection_id,
      product_id,
      title,
      subtitle,
      description,
      slug,
      "order",
      created_at,
      collection_media_items (
        id,
        media_group,
        media_url,
        alt,
        type,
        "order",
        created_at,
        poster_url,
        collection_item_id
      )
    `;

    const { data, error } = await this.dataHelper.client
      .from('collection_items')
      .select(selectFields)
      .eq('collection_id', collectionId)
      .order('order', { ascending: true });

    if (error) throw error;
    return data as any[];
  }

  async getCollectionItemDetail(collectionId: string, itemSlug: string) {
    const selectFields = `
      id,
      collection_id,
      product_id,
      title,
      subtitle,
      description,
      slug,
      "order",
      created_at,
      collection_media_items (
        id,
        media_group,
        media_url,
        alt,
        type,
        "order",
        created_at,
        poster_url,
        collection_item_id
      )
    `;

    const { data, error } = await this.dataHelper.client
      .from('collection_items')
      .select(selectFields)
      .eq('collection_id', collectionId)
      .eq('slug', itemSlug)
      .single();

    if (error) throw error;
    return data as any;
  }
}
