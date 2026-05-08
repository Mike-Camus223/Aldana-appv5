import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { getDataHelperService } from '../getDataHelper.service';
import {
  JournalAuthor,
  JournalCategory,
  JournalPostBlock,
  JournalPostDetail,
  JournalPostListRow,
} from './journal.models';

const POST_LIST_SELECT = `
  id,
  title,
  slug,
  excerpt,
  cover_image,
  published_at,
  year,
  month,
  image_position,
  category:journal_categories!journal_posts_category_id_fkey (
    id,
    name,
    slug
  )
`;

function single<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  private dataHelper = inject(getDataHelperService);

  private get client() {
    return this.dataHelper.client;
  }

  private normalizeListRow(raw: unknown): JournalPostListRow {
    const r = raw as Record<string, unknown>;
    return {
      id: r['id'] as string,
      title: r['title'] as string,
      slug: r['slug'] as string,
      excerpt: (r['excerpt'] as string) ?? null,
      cover_image: JournalService.normalizeImageUrl((r['cover_image'] as string) ?? null),
      published_at: (r['published_at'] as string) ?? null,
      year: (r['year'] as number) ?? null,
      month: (r['month'] as number) ?? null,
      image_position: (r['image_position'] as string) ?? null,
      category: single<JournalCategory>(r['category'] as JournalCategory | JournalCategory[] | null),
    };
  }

  private normalizeYearMonth(row: JournalPostListRow): void {
    if (row.published_at) {
      const d = new Date(row.published_at);
      if (row.year == null) row.year = d.getFullYear();
      if (row.month == null) row.month = d.getMonth() + 1;
    }
  }

  async getCategories(): Promise<JournalCategory[]> {
    const { data, error } = await this.client
      .from('journal_categories')
      .select('id, name, slug, description, created_at')
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as JournalCategory[];
  }

  async getPublishedYears(): Promise<number[]> {
    const { data, error } = await this.client
      .from('journal_posts')
      .select('year')
      .eq('status', 'published')
      .not('year', 'is', null);
    if (error) throw error;
    const set = new Set<number>();
    for (const row of data || []) {
      if (typeof row.year === 'number') set.add(row.year);
    }
    return [...set].sort((a, b) => b - a);
  }

  async getPublishedMonthsForYear(year: number): Promise<number[]> {
    const { data, error } = await this.client
      .from('journal_posts')
      .select('month')
      .eq('status', 'published')
      .eq('year', year)
      .not('month', 'is', null);
    if (error) throw error;
    const set = new Set<number>();
    for (const row of data || []) {
      if (typeof row.month === 'number') set.add(row.month);
    }
    return [...set].sort((a, b) => b - a);
  }

  async listPublishedPosts(params: {
    categoryId?: string | null;
    year?: number | null;
    month?: number | null;
    order: 'asc' | 'desc';
    page: number;
    pageSize: number;
  }): Promise<{ rows: JournalPostListRow[]; total: number }> {
    const { categoryId, year, month, order, page, pageSize } = params;
    const safePage = Math.max(1, page);
    const from = (safePage - 1) * pageSize;
    const to = from + pageSize - 1;

    let countQuery = this.client
      .from('journal_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');
    if (categoryId) countQuery = countQuery.eq('category_id', categoryId);
    if (year != null && !Number.isNaN(year)) countQuery = countQuery.eq('year', year);
    if (month != null && !Number.isNaN(month)) countQuery = countQuery.eq('month', month);

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    let dataQuery = this.client
      .from('journal_posts')
      .select(POST_LIST_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: order === 'asc', nullsFirst: false })
      .range(from, to);
    if (categoryId) dataQuery = dataQuery.eq('category_id', categoryId);
    if (year != null && !Number.isNaN(year)) dataQuery = dataQuery.eq('year', year);
    if (month != null && !Number.isNaN(month)) dataQuery = dataQuery.eq('month', month);

    const { data, error } = await dataQuery;
    if (error) throw error;

    const rows = (data || []).map((raw) => this.normalizeListRow(raw));
    rows.forEach((r) => this.normalizeYearMonth(r));
    return { rows, total: count ?? 0 };
  }

  async getPublishedPostDetail(
    categorySlug: string,
    year: number,
    month: number,
    postSlug: string
  ): Promise<JournalPostDetail | null> {
    const { data, error } = await this.client
      .from('journal_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        cover_image,
        published_at,
        year,
        month,
        image_position,
        category:journal_categories!journal_posts_category_id_fkey (
          id,
          name,
          slug
        ),
        author:journal_authors!journal_posts_author_id_fkey (
          id,
          name,
          avatar_url,
          bio
        ),
        blocks:journal_post_blocks!journal_post_blocks_post_id_fkey (
          id,
          post_id,
          type,
          content,
          position,
          section_group,
          layout,
          metadata
        )
      `)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const r = data as Record<string, unknown>;

    const row: JournalPostDetail = {
      id: r['id'] as string,
      title: r['title'] as string,
      slug: r['slug'] as string,
      excerpt: (r['excerpt'] as string) ?? null,
      cover_image: JournalService.normalizeImageUrl((r['cover_image'] as string) ?? null),
      published_at: (r['published_at'] as string) ?? null,
      year: (r['year'] as number) ?? null,
      month: (r['month'] as number) ?? null,
      category: single<JournalCategory>(r['category'] as JournalCategory | JournalCategory[] | null),
      author: single<JournalAuthor>(r['author'] as JournalAuthor | JournalAuthor[] | null),
      blocks: Array.isArray(r['blocks'])
        ? (r['blocks'] as JournalPostBlock[]).map((b) => {
            const isImg = ['image', 'img', 'cover'].includes((b.type || '').toLowerCase());
            return {
              ...b,
              section_group: b.section_group ?? 1,
              layout: b.layout ?? 'center',
              content: isImg
                ? (JournalService.normalizeImageUrl(b.content) ?? b.content)
                : b.content,
              metadata: b.metadata ?? {},
            };
          })
        : [],
    };

    if (row.author) {
      row.author.avatar_url = JournalService.normalizeImageUrl(row.author.avatar_url);
    }

    const cat = row.category;
    if (!cat || cat.slug !== categorySlug) return null;

    if (row.blocks?.length) {
      row.blocks.sort((a, b) => {
        const groupA = a.section_group ?? 1;
        const groupB = b.section_group ?? 1;
        if (groupA !== groupB) return groupA - groupB;
        return a.position - b.position;
      });
    }

    this.normalizeYearMonth(row);
    return row;
  }

  async searchPublishedPosts(search: string, limit = 12): Promise<JournalPostListRow[]> {
    const raw = search.trim();
    if (!raw) return [];
    const escaped = raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    const pattern = `%${escaped}%`;
    const { data, error } = await this.client
      .from('journal_posts')
      .select(POST_LIST_SELECT)
      .eq('status', 'published')
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw error;
    const rows = (data || []).map((raw) => this.normalizeListRow(raw));
    rows.forEach((r) => this.normalizeYearMonth(r));
    return rows;
  }

  static buildPostPath(post: JournalPostListRow): string | null {
    if (!post.slug) return null;
    const y = post.year;
    const m = post.month;
    if (y == null || m == null) return null;
    const categorySlug = post.category?.slug;
    if (!categorySlug) return null;
    const monthSeg = String(m).padStart(2, '0');
    return `/journal/${categorySlug}/${y}/${monthSeg}/${post.slug}`;
  }

  static normalizeImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const u = url.trim();
    if (!u) return null;
    if (u.startsWith('http') || u.startsWith('data:')) return u;
    const base = `${environment.SUPABASE_URL}/storage/v1/object/public/aldana-app/`;
    const clean = u.startsWith('/') ? u.substring(1) : u;
    return `${base}${clean}`;
  }
}