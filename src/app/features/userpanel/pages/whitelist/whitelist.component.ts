import { Component, OnInit, OnDestroy } from '@angular/core';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whitelist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whitelist.component.html',
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
    
    // Suscribirse a cambios en la autenticación
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
        this.favorites = favorites || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.isLoading = false;
      }
    });
  }

  navigateToProduct(slug: string) {
    this.router.navigate(['/producto', slug]);
  }

  trackByFn(index: number, item: any): string {
    return item.id;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}