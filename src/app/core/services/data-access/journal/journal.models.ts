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
  /* NUEVO SISTEMA DINÁMICO */
  section_group?: number | null;
  layout_variant?: 'full' | 'split-left' | 'split-right' | 'centered' | 'cta' | null;
  width?: 'full' | 'half' | null;
  alignment?: 'left' | 'center' | 'right' | null;
  button_label?: string | null;
  button_slug?: string | null;
  title: string;
  subtitle: string;
  open_in_new_tab?: boolean | null;
  background_style?: string | null;
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