export interface MediaItem {
  url: string;
  alt?: string;
  caption?: string;
  poster?: string;
  type?: 'image' | 'video';
  fit?: 'cover' | 'contain';
  width?: number;
  height?: number;
}