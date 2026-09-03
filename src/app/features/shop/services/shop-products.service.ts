import { Injectable } from '@angular/core';
import { DataHelperService } from '../../../core/data-access/data-helper.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  // Simple in-memory cache with TTL
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

  constructor(
    private helper: DataHelperService
  ) {}

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setInCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  async getAllCollections(department?: 'pret-a-porter' | 'bridal') {
    const cacheKey = `collections_${department || 'all'}`;
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) return cached;

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
      department
    `;

    let query = this.helper.client
      .from('collections')
      .select(selectFields);

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query.order('release_date', { ascending: false });
    if (error) throw error;
    
    this.setInCache(cacheKey, data);
    return data;
  }

  async getCollectionById(slug: string) {
    const cacheKey = `collection_slug_${slug}`;
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

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
      department
    `;

    const { data, error } = await this.helper.client
      .from('collections')
      .select(selectFields)
      .eq('slug', slug)
      .single();

    if (error) throw error;
    this.setInCache(cacheKey, data);
    return data;
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

  async getProducts(slug?: string, department?: 'pret-a-porter' | 'bridal') {
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
      department,
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

    let query = this.helper.client.from('products').select(selectProducts);
    if (slug) {
      query = query.eq('slug', slug);
      const { data, error } = await query.maybeSingle();
      return { data, error };
    }
    if (department) {
      query = query.eq('department', department);
    }
    const { data, error } = await query;
    return { data, error };
  }

  async getProductsByCategory(categoryId: string | number, limit: number = 6, department?: 'pret-a-porter' | 'bridal') {
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
      department,
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

    let query = this.helper.client
      .from('products')
      .select(selectProducts)
      .eq('category_id', categoryId);

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query.limit(limit);
    return { data, error };
  }

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
      department,
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
    department?: 'pret-a-porter' | 'bridal' | null;
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
      department,
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

    if (options.department) {
      query = query.eq('department', options.department);
    }

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

  async getLatestProducts(limit: number = 32, department?: 'pret-a-porter' | 'bridal') {
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
      department,
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

    let query = this.helper.client
      .from('products')
      .select(selectProducts);

    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  }

  /** Búsqueda optimizada del lado del servidor */
  async searchProducts(searchTerm: string, limit: number = 40) {
    if (!searchTerm || !searchTerm.trim()) {
      return { data: [], error: null };
    }
    const cleanTerm = searchTerm.trim();

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
      department,
      categories:categories!products_category_id_fkey (
        id,
        name
      ),
      subcategories:subcategories!products_subcategory_id_fkey (
        id,
        name
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
      .or(`name.ilike.%${cleanTerm}%,slug.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%,details.ilike.%${cleanTerm}%`)
      .limit(limit);

    return { data: data || [], error };
  }

  async getCategories() {
    return this.helper.getData<any[]>('categories', 'id, name');
  }

  async getSubcategories() {
    return this.helper.getData<any[]>('subcategories', 'id, name, category_id');
  }
}

