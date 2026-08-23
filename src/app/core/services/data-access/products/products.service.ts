import { Injectable } from '@angular/core';
import { getDataHelperService } from '../getDataHelper.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  constructor(
    private helper: getDataHelperService
  ) {}

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

    const result = await this.helper.getData<any[]>(
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
      slug
    `;

    const result = await this.helper.getData<any>(
      'collections',
      selectFields,
      'slug',
      slug,
      true
    );

    if (result.error) throw result.error;
    return result.data;
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

    const { data, error } = await this.helper.client
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

    const { data, error } = await this.helper.client
      .from('collection_items')
      .select(selectFields)
      .eq('collection_id', collectionId)
      .eq('slug', itemSlug)
      .single();

    if (error) throw error;
    return data as any;
  }
  

  async getProducts(slug?: string) {
    const selectProducts = `
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
      categories:categories!products_category_id_fkey (
        id,
        name
      ),
      subcategories:subcategories!products_subcategory_id_fkey (
        id,
        name
      ),
      product_collections (
        collection_id,
        collections (
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
        media
      )
    `;

    return this.helper.getData<any>(
      'products',
      selectProducts,
      slug ? 'slug' : undefined,
      slug,
      Boolean(slug)
    );
  }

  async getProductsByCategory(categoryId: string, limit: number = 6) {
    const selectProducts = `
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
      product_variants (
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
      .from('products')
      .select(selectProducts)
      .eq('category_id', categoryId)
      .limit(limit);

    return { data, error };
  }

  /** Misma forma que getProducts(), para cargar varios por id (p. ej. thumbnails en collection_items). */
  async getProductsByIds(ids: string[]): Promise<any[]> {
    if (!ids.length) return [];
    const selectProducts = `
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
      categories:categories!products_category_id_fkey (
        id,
        name
      ),
      subcategories:subcategories!products_subcategory_id_fkey (
        id,
        name
      ),
      product_collections (
        collection_id,
        collections (
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
        media
      )
    `;
    const { data, error } = await this.helper.client
      .from('products')
      .select(selectProducts)
      .in('id', ids);
    if (error) throw error;
    return (data as any[]) ?? [];
  }

  async getProductsPaged(options: {
    categoryName?: string;
    categoryId?: number | string | null;
    collectionId?: string | null;
    page: number;
    pageSize: number;
  }) {
    const selectProducts = `
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
      categories:categories!products_category_id_fkey (
        id,
        name
      ),
      subcategories:subcategories!products_subcategory_id_fkey (
        id,
        name
      ),
      product_collections (
        collection_id,
        collections (
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
        media
      ),
      created_at
    `;

    let selectFields = selectProducts;
    if (options.collectionId) {
      selectFields = selectFields.replace(
        'product_collections (',
        'product_collections!inner ('
      );
    }

    if (options.categoryName && !options.categoryId) {
      selectFields = selectFields.replace(
        'categories:categories!products_category_id_fkey (',
        'categories:categories!products_category_id_fkey!inner ('
      );
    }

    let query = this.helper.client
      .from('products')
      .select(selectFields, { count: 'exact' });

    if (options.collectionId) {
      query = query.eq('product_collections.collection_id', options.collectionId);
    }

    if (options.categoryId !== undefined && options.categoryId !== null) {
      query = query.eq('category_id', options.categoryId);
    } else if (options.categoryName) {
      if (options.categoryName.toLowerCase() === 'otros') {
        query = query.not('categories.name', 'in', '("Sastrería","Sastrero","Camperas","Tops","Pantalones y Faldas","Buzos","Vestidos y Monos","Accesorios")');
      } else {
        query = query.ilike('categories.name', options.categoryName);
      }
    }

    const from = (options.page - 1) * options.pageSize;
    const to = from + options.pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    return { data, error, count };
  }

  async getLatestProducts(limit: number = 32) {
    const selectProducts = `
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
      categories:categories!products_category_id_fkey (
        id,
        name
      ),
      subcategories:subcategories!products_subcategory_id_fkey (
        id,
        name
      ),
      product_collections (
        collection_id,
        collections (
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
        media
      ),
      created_at
    `;

    const { data, error } = await this.helper.client
      .from('products')
      .select(selectProducts)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  }

  async getCategories() {
    return this.helper.getData<any[]>('categories', 'id, name');
  }

  async getSubcategories() {
    return this.helper.getData<any[]>('subcategories', 'id, name, category_id');
  }
}
