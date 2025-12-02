import { Injectable } from '@angular/core';
import { getDataHelperService } from '../getDataHelper.service';

@Injectable({
  providedIn: 'root'
})
export class BridesProductsService {

  constructor(private db: getDataHelperService) {}

  // SELECT BASE, igual estilo que products
  private selectFields = `
    id,
    name,
    description,
    details,
    metadata,
    main_image,
    additional_images,
    slug,
    avid,
    color_id,
    color_name,
    color_hex,
    created_at,
    collection_brides:collection_brides!pbrides_products_collection_id_fkey (
      id,
      name,
      slug,
      cover_image_url
    )
  `;

  // Obtener todos los vestidos de novia
  async getAllBridesProducts() {
    return this.db.getData<any[]>(
      'pbrides_products',
      this.selectFields
    );
  }

  // Obtener un vestido de novia por slug
  async getBridesProductBySlug(slug: string) {
    return this.db.getData<any>(
      'pbrides_products',
      this.selectFields,
      'slug',
      slug,
      true
    );
  }

  // Si quieres buscar por avid
  async getBridesProductByAvid(avid: string) {
    return this.db.getData<any>(
      'pbrides_products',
      this.selectFields,
      'avid',
      avid,
      true
    );
  }

}
