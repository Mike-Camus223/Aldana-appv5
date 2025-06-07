
export interface ProductImage {
  id: string;
  image_url: string;
  is_main: boolean;
}

export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  product_images: ProductImage[];
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  variants: ProductVariant[];
  product_images: ProductImage[];
  mainImageUrl: string;
  colors: string[];
  category: string; 
  wishlisted?: boolean;
}