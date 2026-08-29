import { Injectable } from '@angular/core';
import { getDataHelperService } from '../getDataHelper.service';
import { ProductsService } from '../products/products.service';

@Injectable({
  providedIn: 'root'
})
export class BridesProductsService {

  constructor(
    private helper: getDataHelperService,
    private productsService: ProductsService
  ) {}

  async getProducts(slug?: string) {
    return this.productsService.getProducts(slug, 'bridal');
  }

  async getProductsByCategory(categoryId: string | number, limit: number = 6) {
    return this.productsService.getProductsByCategory(categoryId, limit, 'bridal');
  }

  async getProductsByIds(ids: string[]): Promise<any[]> {
    return this.productsService.getProductsByIds(ids);
  }

  async getProductVariants(productId: string) {
    const selectFields = `
      id,
      color_id,
      color_name,
      color_hex,
      avid,
      main_image,
      media,
      colors:colors!product_variants_color_id_fkey (
        code,
        name,
        hex
      )
    `;

    return this.helper.getData<any>(
      'product_variants',
      selectFields,
      'product_id',
      productId
    );
  }

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

    const { data, error } = await this.helper.client
      .from('collections')
      .select(selectFields)
      .eq('department', 'bridal')
      .order('release_date', { ascending: false });

    return { data, error };
  }

  async getProductsPaged(options: {
    collectionId?: string | null;
    page: number;
    pageSize: number;
  }) {
    return this.productsService.getProductsPaged({
      collectionId: options.collectionId,
      department: 'bridal',
      page: options.page,
      pageSize: options.pageSize
    });
  }

  async getLatestProducts(limit: number = 32) {
    return this.productsService.getLatestProducts(limit, 'bridal');
  }

  async getCategories() {
    return this.helper.getData<any[]>('categories', 'id, name');
  }

  async getSubcategories() {
    return this.helper.getData<any[]>('subcategories', 'id, name, category_id');
  }
}

