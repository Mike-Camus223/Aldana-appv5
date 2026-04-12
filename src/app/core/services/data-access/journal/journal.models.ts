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
}

export interface JournalPostDetail extends JournalPostListRow {
  author?: JournalAuthor | null;
  blocks?: JournalPostBlock[];
}
