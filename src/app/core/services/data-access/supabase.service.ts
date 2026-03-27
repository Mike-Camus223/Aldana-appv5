import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  private async getData<T>(
    table: string,
    select: string,
    filterKey?: string,
    filterValue?: any,
    single: boolean = false
  ): Promise<{ data: T | null; error: any }> {
    let query = this.supabase.from(table).select(select);

    if (filterKey && filterValue !== undefined) {
      query = query.eq(filterKey, filterValue);
    }

    const result = single ? await query.single() : await query;

    return {
      data: result.error ? null : (result.data as T),
      error: result.error,
    };
  }

  async subscribeEmail(email: string, origin: string) {
    const payload = {
      email,
      origin,
      created_at: new Date().toISOString()
    };
    const result = await this.supabase
      .from('newsletter_subscribers')
      .insert(payload)
      .select()
      .single();
    return { data: result.data, error: result.error };
  }

  async getProducts(slug?: string) {
    const selectProducts = `
      id,
      name,
      description,
      details,
      price,
      category_id,
      subcategory_id,
      main_image,
      additional_images,
      sizes,
      slug,
      avid,
      color_id,        
    color_name,       
    color_hex,        
      categories:categories!products_category_id_fkey (
        id,
        name
      ),
      subcategories:subcategories!products_subcategory_id_fkey (
        id,
        name
      ),
      product_collections (
        collection_id,
        collections (
          id,
          name,
          slug
        )
      ),
      product_variants (
    id,
    color_id,
    color_name,
    color_hex,
    avid,
    main_image,
    additional_images,
    colors:colors!product_variants_color_id_fkey (
    code,
    name,
    hex
  )
)
    `;

    return this.getData<any>(
      'products',
      selectProducts,
      slug ? 'slug' : undefined,
      slug,
      Boolean(slug)
    );
  }

  async getCategories() {
    return this.getData<any[]>('categories', 'id, name');
  }

  async getSubcategories() {
    return this.getData<any[]>('subcategories', 'id, name, category_id');
  }

  async getContentForPages<T>(slug: string): Promise<T | null> {
    const result = await this.getData<T>(
      'generic_data_pages',
      `
      id,
      page_slug,
      generic_data_sections (
        id,
        section_order,
        generic_data_contents (
          id,
          content_type,
          content_order,
          content_text,
          image_url,
          video_url,
          is_main
        )
      )
    `,
      'page_slug',
      slug,
      true
    );
    return result.data;
  }

  async getInstagramReels() {
    try {      
      // Intentar primero con el ID de Instagram directo
      const response = await fetch('https://graph.facebook.com/v18.0/17841444599332423/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=EAAI user token aqui', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: string };
        console.error('Error obteniendo reels de Instagram:', errorData);
        
        // Si falla el método directo, volver a la función Edge
        return this.getInstagramReelsFromEdge();
      }

      const mediaData = await response.json();
      
      // Filtrar solo videos/reels
      const videos = mediaData.data?.filter((item: any) => 
        item.media_type === 'VIDEO' || item.media_type === 'REELS'
      ) || [];
      
      // Procesar los videos con comentarios
      const reels = await Promise.all(
        videos.slice(0, 5).map(async (reel: any) => {
          // Obtener comentarios reales
          let comments = [];
          try {
            const commentsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${reel.id}/comments?fields=text,username,timestamp,user{id,name,profile_pic}&limit=10&access_token=EAAI user token aqui`
            );
            
            if (commentsResponse.ok) {
              const commentsData = await commentsResponse.json();
              comments = (commentsData.data || []).map((comment: any) => ({
                user: comment.username || comment.user?.name || 'Usuario',
                text: comment.text,
                time: this.formatTimeAgo(new Date(comment.timestamp)),
                profile_pic: comment.user?.profile_pic || null
              }));
            }
          } catch (e) {
            console.warn('Error obteniendo comentarios para', reel.id);
          }
          
          return {
            id: reel.id,
            image_url: reel.thumbnail_url || reel.media_url,
            caption: reel.caption || '',
            hashtags: this.extractHashtags(reel.caption || ''),
            post_url: reel.permalink,
            media_type: reel.media_type,
            media_url: reel.media_url,
            like_count: reel.like_count || 0,
            comments_count: reel.comments_count || 0,
            timestamp: reel.timestamp,
            comments: comments,
            media: [{
              url: reel.media_url,
              type: 'video'
            }]
          };
        })
      );
            
      return { data: reels, error: null };
    } catch (error) {
      console.error('Error en getInstagramReels:', error);
      // Si falla el método directo, volver a la función Edge
      return this.getInstagramReelsFromEdge();
    }
  }

  private async getInstagramReelsFromEdge() {
    try {
      
      const response = await fetch('https://cddrmboopihkiuyomxle.supabase.co/functions/v1/IG_function', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${environment.SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' })) as { error?: string };
        console.error('Error en función Edge:', errorData);
        return { data: null, error: errorData.error || 'Error en la función Edge' };
      }

      const result = await response.json();
      
      // Combinar y ordenar reels e historias por fecha y likes
      const allMedia = result.data || [];
      
      // Ordenar por timestamp (más recientes primero) y luego por likes
      const sortedMedia = allMedia.sort((a: any, b: any) => {
        // Primero por fecha (más reciente primero)
        const dateA = new Date(a.timestamp || 0).getTime();
        const dateB = new Date(b.timestamp || 0).getTime();
        
        if (dateB !== dateA) {
          return dateB - dateA; // Más reciente primero
        }
        
        // Si mismo tiempo, ordenar por likes (más likes primero)
        return (b.like_count || 0) - (a.like_count || 0);
      });
      
      // Limitar a los primeros 5
      const limitedData = sortedMedia.slice(0, 5);      
      return { data: limitedData, error: null };
    } catch (error) {
      console.error('Error en función Edge:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { data: null, error: errorMessage };
    }
  }

  private extractHashtags(text: string): string {
    const hashtags = text.match(/#\w+/g);
    return hashtags ? hashtags.join(' ') : '';
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime())) / 1000;
    
    if (diffInSeconds < 60) {
      return 'hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
  }



  async validateCoupon(code: string): Promise<{
    valid: boolean;
    discountAmount?: number;
    discountType?: 'percent' | 'fixed';
    error?: string;
  }> {
    const { data, error } = await this.supabase
      .from('discount_codes')
      .select('id, code, discount_type, amount, is_active, expires_at')
      .eq('code', code)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Cupón no encontrado.' };
    }

    if (!data.is_active) {
      return { valid: false, error: 'Cupón inactivo.' };
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Cupón expirado.' };
    }

    return {
      valid: true,
      discountAmount: data.amount,
      discountType: data.discount_type
    };
  }

  async getAllCollections() {
    const selectFields = `
      id,
      uuid,
      name,
      cover_image_url,
      season,
      release_date,
      created_at,
      banner,
      description,
      slug
    `;

    const result = await this.getData<any[]>(
      'collections',
      selectFields
    );

    if (result.error) throw result.error;
    return result.data;
  }

  async getCollectionById(slug: string) {
    const selectFields = `
      id,
      uuid,
      name,
      cover_image_url,
      season,
      release_date,
      created_at,
      banner,
      description,
      slug,
      collection_media (
        id,
        collection_id,
        section_name,
        media_url,
        alt,
        type,
        order,
        created_at,
        poster_url
      )
    `;

    const result = await this.getData<any>(
      'collections',
      selectFields,
      'slug',
      slug,
      true
    );

    if (result.error) throw result.error;
    return result.data;
  }
}
