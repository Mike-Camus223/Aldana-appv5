import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';

@Injectable({
  providedIn: 'root'
})
export class InstagramserviceService {

  constructor(
    private supabaseService: SupabaseService
  ) { }

  async getInstagramReels() {
    try {
      // Intentar primero con el ID de Instagram directo
      // Eliminamos 'Content-Type' para evitar problemas de CORS en GET
      const response = await fetch('https://graph.facebook.com/v18.0/17841444599332423/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=EAAI', {
        method: 'GET'
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
              `https://graph.facebook.com/v18.0/${reel.id}/comments?fields=text,username,timestamp,user{id,name,profile_pic}&limit=10&access_token=EAAI`
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
          'Authorization': `Bearer ${this.supabaseService.key}`,
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
}
