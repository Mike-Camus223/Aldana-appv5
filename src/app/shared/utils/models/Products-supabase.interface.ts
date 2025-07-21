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
  color_name: string;
  color_hex: string;
  avid: string;
  main_image?: string;
  additional_images?: string[]; 
  isBase?: boolean; 

}

export interface Category {
  id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  price: number;
  variants: ProductVariant[];
  main_image: string;
  additional_images: string[];
  sizes: string[];
  slug: string;
  category: Category;
  subcategory?: Subcategory;
  wishlisted?: boolean;
}

