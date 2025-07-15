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
export interface CollectionMedia {
  id: string;
  collection_id: string;
  section_name: string;
  media_url: string;
  alt?: string;
  type: 'image' | 'video';
  order?: number;
  created_at?: string;
  poster_url?: string;
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
  collection_media: CollectionMedia[];
}
