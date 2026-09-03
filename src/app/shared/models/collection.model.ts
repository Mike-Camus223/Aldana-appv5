export interface Collection {
  id: string;
  name: string;
  cover_image_url: string;
  season: string;
  release_date: string;
  banner: string | null;
  description?: string;
  slug: string;
}

export interface CollectionWithMedia {
  id: string;
  uuid?: string;
  name: string;
  cover_image_url: string;
  season: string;
  release_date: string;
  created_at?: string;
  banner?: string;
  description?: string;
  slug?: string;
  collection_media: any[];
}

export interface CollectionBridesWithMedia {
  id: string;
  uuid?: string;
  name: string;
  cover_image_url: string;
  season: string;
  release_date: string;
  created_at?: string;
  banner?: string;
  description?: string;
  slug?: string;
  collection_media_brides: any[];
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  product_id?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  slug: string;
  order?: number | null;
  created_at?: string;
}

export interface CollectionMediaItem {
  id: string;
  collection_item_id: string;
  media_group: string;
  media_url: string;
  alt?: string | null;
  type: 'image' | 'video';
  order?: number | null;
  poster_url?: string | null;
  created_at?: string;
}
