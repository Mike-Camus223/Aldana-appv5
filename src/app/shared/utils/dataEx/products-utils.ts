import { Product, ProductVariant } from '../models/Products-supabase.interface';


export class ProductUtils {
  static mapProducts(data: any[]): Product[] {
    return data.map(p => {
      const hasValidBaseColor = p.color_name && p.color_name.trim() !== '' && p.color_hex && p.color_hex !== '#000000';
      const variants: ProductVariant[] = [];

      if (hasValidBaseColor) {
        variants.push({
          id: p.id,
          color_name: p.color_name,
          color_hex: p.color_hex,
          avid: p.avid || '',
          main_image: p.main_image?.trim() || '',
          additional_images: p.additional_images || [],
          isBase: true
        });
      }

      if (Array.isArray(p.product_variants)) {
        variants.push(...p.product_variants.map((v: any) => ({
          id: v.id,
          color_name: v.color_name,
          color_hex: v.color_hex,
          avid: v.avid,
          main_image: v.main_image?.trim() || '',
          additional_images: v.additional_images || [],
          isBase: false
        })));
      }

      return {
        id: p.id,
        name: p.name,
        details: p.details || '',
        description: p.description,
        price: p.price || 0,
        variants,
        main_image: (variants.length > 0 && variants[0].main_image?.trim()) ? variants[0].main_image.trim() : '',
        additional_images: (variants.length > 0 && variants[0].additional_images) ? variants[0].additional_images : [],
        sizes: p.sizes || [],
        slug: p.slug || '',
        wishlisted: false,
        category: p.categories?.name?.toLowerCase() || '',
        subcategory: p.subcategories?.name?.toLowerCase() || ''
      };

    });
  }
  static normalize(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}