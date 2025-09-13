import { Injectable, inject } from '@angular/core';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Product } from '../../../shared/utils/models/Products-supabase.interface';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private authService = inject(AuthService);
  private supabase: SupabaseClient;
  private favoritesSubject = new BehaviorSubject<string[]>([]);

  favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.supabase = this.authService.getAuthenticatedClient();
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserFavorites(user.id).subscribe();
      } else {
        this.favoritesSubject.next([]);
      }
    });
  }

  private loadUserFavorites(userId: string): Observable<string[]> {
    return from(this.supabase
      .from('user_favorites')
      .select('product_id')
      .eq('user_id', userId))
      .pipe(
        map(response => {
          if (response.error) throw response.error;
          const favoriteIds = response.data.map(fav => fav.product_id);
          this.favoritesSubject.next(favoriteIds);
          return favoriteIds;
        }),
        catchError(error => {
          console.error('Error loading user favorites:', error);
          return of([]);
        })
      );
  }

  getFavorites(): Observable<Product[]> {
    const user = this.authService.getCurrentUser();
    if (!user) return of([]);

    return from(this.supabase
      .from('user_favorites')
      .select('products(*)')
      .eq('user_id', user.id))
      .pipe(
        map(response => {
          if (response.error) throw response.error;
          return response.data.map((item: any) => item.products) as Product[];
        }),
        catchError(error => {
          console.error('Error fetching favorite products:', error);
          return of([]);
        })
      );
  }

  addFavorite(productId: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(null);

    return from(this.supabase
      .from('user_favorites')
      .insert({ user_id: user.id, product_id: productId }))
      .pipe(
        tap(() => {
          const currentFavorites = this.favoritesSubject.getValue();
          this.favoritesSubject.next([...currentFavorites, productId]);
        }),
        catchError(error => {
          console.error('Error adding favorite:', error);
          return of(null);
        })
      );
  }

  removeFavorite(productId: string): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user) return of(null);

    return from(this.supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId))
      .pipe(
        tap(() => {
          const currentFavorites = this.favoritesSubject.getValue();
          this.favoritesSubject.next(currentFavorites.filter(id => id !== productId));
        }),
        catchError(error => {
          console.error('Error removing favorite:', error);
          return of(null);
        })
      );
  }

  isFavorite(productId: string): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.includes(productId))
    );
  }
}
