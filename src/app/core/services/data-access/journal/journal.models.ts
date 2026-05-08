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

export interface BlockMetadata {
  button?: {
    url?: string | null;
    label?: string | null;
    newTab?: boolean | null;
    button_style?: 'normal' | 'underline' | null;
  } | null;
  paragraph?: {
    heading?: { text: string; enabled: boolean } | null;
    subheading?: { text: string; enabled: boolean } | null;
  } | null;
  inlineLink?: {
    sl_position?: 'inline-start' | 'inline-end';
    sl_link?: string;
    sl_link_name?: string;
    sl_style?: string;
  } | null;
}

export interface JournalPostBlock {
  id: string;
  post_id: string;
  type: string;
  content?: string | null;
  position: number;
  section_group?: number | null;
  layout?: 'left' | 'right' | 'center' | null;
  metadata?: BlockMetadata | null;
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