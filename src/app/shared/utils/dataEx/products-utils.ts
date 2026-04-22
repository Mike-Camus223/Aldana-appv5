import { Product, ProductVariant, MediaItemJSONB } from '../models/Products-supabase.interface';


export class ProductUtils {
  static mapProducts(data: any[]): Product[] {
    return data.map(p => {
      const hasValidBaseColor = p.color_name && p.color_name.trim() !== '' && p.color_hex && p.color_hex !== '#000000';
      const variants: ProductVariant[] = [];

      const rawProductMedia = Array.isArray(p.media) ? (p.media as MediaItemJSONB[]) : [];

      if (hasValidBaseColor) {
        variants.push({
          id: p.id,
          color_name: p.color_name,
          color_hex: p.color_hex,
          avid: p.avid || '',
          main_image: p.main_image?.trim() || '',
          media: rawProductMedia,
          isBase: true
        });
      }

      // Handle product_variants (aliased or not)
      const rawVariants = p.product_variants || p.pbrides_product_variants || [];
      if (Array.isArray(rawVariants)) {
        variants.push(...rawVariants.map((v: any) => ({
          id: v.id,
          color_name: v.color_name,
          color_hex: v.color_hex,
          avid: v.avid,
          main_image: v.main_image?.trim() || '',
          media: Array.isArray(v.media) ? (v.media as MediaItemJSONB[]) : [],
          isBase: false
        })));
      }

      const rawMainImage = String(p.main_image ?? '').trim();
      const variantMainImage =
        variants.length > 0 ? String(variants[0].main_image ?? '').trim() : '';

      // Normal and Bridal collections
      let collections: any[] = [];
      const rawCollections = p.product_collections || p.pbrides_product_collections || [];
      if (Array.isArray(rawCollections)) {
        collections = rawCollections
          .map((pc: any) => pc.collections || pc.collection_brides || pc.collection)
          .filter(Boolean);
      }

      // Handle Category
      const catObj = p.categories || p.pbrides_categories || p.category;
      const category = {
        id: catObj?.id || 0,
        name: catObj?.name?.toLowerCase() || (String(p.name || '').toLowerCase().includes('velo') ? 'velos' : 'vestidos de novia')
      };

      // Handle Subcategory
      const subcatObj = p.subcategories || p.pbrides_subcategories || p.subcategory;
      const subcategory = subcatObj ? {
        id: subcatObj?.id || 0,
        name: subcatObj?.name?.toLowerCase() || 'general'
      } : undefined;

      return {
        id: p.id,
        name: p.name,
        details: p.details || '',
        description: p.description,
        price: Number(p.price || 0),
        variants,
        main_image: variantMainImage || rawMainImage,
        media: rawProductMedia,
        sizes: p.sizes || [],
        slug: p.slug || '',
        wishlisted: false,
        category_id: category.id,
        category,
        subcategory_id: subcategory?.id,
        subcategory,
        collections
      };
    });
  }

  static getMediaByUse(media: MediaItemJSONB[], use: 'shop' | 'product' | 'collection'): MediaItemJSONB[] {
    if (!Array.isArray(media)) return [];
    return media.filter(m => Array.isArray(m.use) && m.use.includes(use));
  }

  static normalize(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}