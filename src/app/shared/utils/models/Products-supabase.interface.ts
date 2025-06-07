export interface ProductImage {
  id: string;
  image_url: string;
  is_main: boolean;
}

export interface ProductVariant {
  id: string;
  color: string;
  price: number;
  product_images: ProductImage[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  price: number;
  variants: ProductVariant[];
  product_images: ProductImage[];
  mainImageUrl: string;
  colors: string[];
  category: string;
  wishlisted?: boolean;
}
