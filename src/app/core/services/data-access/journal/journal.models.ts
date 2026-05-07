export interface JournalCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at?: string;
}

export interface JournalAuthor {
  id: string;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface JournalPostBlock {
  id: string;
  post_id: string;
  type: string;
  content?: string | null;
  url?: string | null;
  position: number;
  section_group?: number | null;
  layout_variant?: 'full' | 'split-left' | 'split-right' | 'centered' | 'cta' | 'collection-carousel' | null;
  width?: 'full' | 'half' | null;
  alignment?: 'left' | 'center' | 'right' | null;
  button_label?: string | null;
  button_slug?: string | null;
  open_in_new_tab?: boolean | null;
  paragraph_meta?: ParagraphMeta | null;
  section_link_meta?: SectionLinkMeta | null;
  // Para collection-carousel
  collection_slug?: string | null;
  collection_type?: 'standard' | 'brides' | null;
}

export interface ParagraphMeta {
  heading?: {
    text: string;
    enabled: boolean;
  };
  subheading?: {
    text: string;
    enabled: boolean;
  };
}

export interface SectionLinkMeta {
  sl_position?: 'inline-start' | 'inline-end';
  sl_link?: string;
  sl_link_name?: string;
  sl_style?: string;
}

export interface JournalPostListRow {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  year?: number | null;
  month?: number | null;
  category?: JournalCategory | null;
  image_position?: string | null;
}

export interface JournalPostDetail extends JournalPostListRow {
  author?: JournalAuthor | null;
  blocks?: JournalPostBlock[];
}