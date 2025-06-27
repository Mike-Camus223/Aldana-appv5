export interface ProductImage {
  id: string;
  image_url: string;
  is_main: boolean;
}

export interface ProductSize {
  id: string;
  size: string;
}

export interface ProductVariant {
  id: string;
  color: string;
  product_images: ProductImage[];
  product_sizes: ProductSize[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  price: number;
  category: string;
  subcategory?: string;  
  variants: ProductVariant[];
  product_images: ProductImage[]; 
  mainImageUrl: string; 
  colors: string[];
  wishlisted?: boolean;
}
