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

  async getCollectionById(slug: string) {
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
      slug,
      collection_media (
        id,
        collection_id,
        section_name,
        media_url,
        alt,
        type,
        order,
        created_at,
        poster_url
      )
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
}
