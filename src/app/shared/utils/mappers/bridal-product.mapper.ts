/**
 * Mapper / helper para selección de miniatura de vestidos y productos de novias.
 */
export class BridalProductMapper {
  static displayMainImage(p: any): string {
    const hasValidBaseColor =
      p.color_name &&
      String(p.color_name).trim() !== '' &&
      p.color_hex &&
      p.color_hex !== '#000000';

    const rawMain = String(p.main_image ?? '').trim();

    const variantMainFromFirst = (): string => {
      const pv = Array.isArray(p.product_variants) ? p.product_variants : [];
      if (!pv.length) return '';
      return String(pv[0]?.main_image ?? '').trim();
    };

    if (hasValidBaseColor) {
      const base = rawMain;
      if (base) return base;
    }

    return variantMainFromFirst() || rawMain;
  }
}

// Alias para compatibilidad hacia atrás
export { BridalProductMapper as BridesProductUtils };
