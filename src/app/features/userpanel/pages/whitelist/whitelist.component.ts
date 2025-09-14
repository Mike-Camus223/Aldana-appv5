import { Component, OnInit, OnDestroy } from '@angular/core';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Heart, HeartPlus, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-whitelist',
  standalone: true,
  imports: [CommonModule,LucideAngularModule],
  templateUrl: './whitelist.component.html',
  providers: [
      {
        provide: LUCIDE_ICONS,
        multi: true,
        useValue: new LucideIconProvider({
          Heart,
          HeartPlus
        })
      }
    ],
  styleUrls: ['./whitelist.component.css']
})
export class WhitelistComponent implements OnInit, OnDestroy {
  favorites: any[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFavorites();
    
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.loadFavorites();
        } else {
          this.favorites = [];
          this.isLoading = false;
        }
      });
  }

  private loadFavorites() {
    if (!this.authService.isAuthenticated()) {
      this.isLoading = false;
      this.favorites = [];
      return;
    }

    this.isLoading = true;
    this.favoritesService.favorites$.subscribe({
      next: (favorites) => {
        // Ensure wishlisted is set to true for all favorited products
        this.favorites = (favorites || []).map(fav => ({
          ...fav,
          product: {
            ...fav.product,
            wishlisted: true // Set wishlisted to true since these are all favorited items
          }
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.isLoading = false;
      }
    });
  }

  
  async toggleFavorite(event: Event, productId: string) {
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      alert('Por favor inicia sesión para modificar favoritos');
      return;
    }

    try {
      const result = await this.favoritesService.toggleFavorite(productId);
      alert(result.message);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Ocurrió un error al actualizar favoritos');
    }
  }

  navigateToProduct(slug: string) {
    this.router.navigate(['/producto', slug]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}