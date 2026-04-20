export interface ProductImage {
  id: string;
  image_url: string;
  is_main: boolean;
}

export interface ProductSize {
  id: string;
  size: string;
}

export interface MediaItemJSONB {
  url: string;
  type: 'image' | 'video';
  use: ('shop' | 'product' | 'collection')[];
  poster?: string;
}

export interface ProductVariant {
  id: string;
  color_name: string;
  color_hex: string;
  avid: string;
  main_image?: string;
  media: MediaItemJSONB[]; 
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

export interface Collection {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  price: number;
  variants: ProductVariant[];
  main_image: string;
  media: MediaItemJSONB[];
  sizes: string[];
  slug: string;
  category: Category;
  subcategory?: Subcategory;
  wishlisted?: boolean;
  collections?: Collection[];
}

