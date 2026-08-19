import { Injectable } from '@angular/core';
import { SupabaseService } from '../data-access/supabase.service';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, tap, map, catchError } from 'rxjs/operators';

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: any; // Product details will be joined
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favoritesSubject = new BehaviorSubject<Favorite[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadFavorites();
      } else {
        this.favoritesSubject.next([]);
      }
    });
  }

  private async loadFavorites() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.favoritesSubject.next([]);
      return;
    }

    try {
      const { data, error } = await this.supabase['supabase']
        .from('user_favorites')
        .select(`
          *,
          product:products (
            id,
            name,
            price,
            main_image,
            slug
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      this.favoritesSubject.next(data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favoritesSubject.next([]);
    }
  }

  async refreshFavorites() {
    await this.loadFavorites();
  }

  async toggleFavorite(productId: string): Promise<{ success: boolean; message: string }> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Debes iniciar sesión para guardar favoritos' };
    }

    try {
      // Check if already favorited
      const { data: existing } = await this.supabase['supabase']
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Remove from favorites
        const { error } = await this.supabase['supabase']
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        if (error) throw error;
        await this.loadFavorites();
        return { success: true, message: 'Producto eliminado de favoritos' };
      } else {
        // Add to favorites
        const { error } = await this.supabase['supabase']
          .from('user_favorites')
          .insert([{ user_id: user.id, product_id: productId }]);
        
        if (error) throw error;
        await this.loadFavorites();
        return { success: true, message: 'Producto añadido a favoritos' };
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return { 
        success: false, 
        message: 'Error al actualizar favoritos. Inténtalo de nuevo.' 
      };
    }
  }

  async isFavorite(productId: string): Promise<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) return false;

    try {
      const { data, error } = await this.supabase['supabase']
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      return !!data;
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  async removeMultipleFavorites(productIds: string[]): Promise<{ success: boolean; message: string }> {
    const user = this.authService.getCurrentUser();
    if (!user) return { success: false, message: 'Debes iniciar sesión' };
    if (!productIds.length) return { success: true, message: 'Nada para eliminar' };

    try {
      const { error } = await this.supabase['supabase']
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .in('product_id', productIds);

      if (error) throw error;
      await this.loadFavorites();
      return { success: true, message: 'Favoritos eliminados correctamente' };
    } catch (error) {
      console.error('Error removing multiple favorites:', error);
      return { success: false, message: 'Error al eliminar favoritos' };
    }
  }

  getFavorites(): Observable<Favorite[]> {
    return this.favorites$;
  }
}
