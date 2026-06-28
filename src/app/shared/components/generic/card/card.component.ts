import { Component, Input, OnInit } from '@angular/core';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
})
export class CardComponent implements OnInit {
  @Input() product: any;
  isFavorite = false;
  isLoading = false;

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    if (this.product?.id) {
      this.checkIfFavorite();
    }
  }

  private async checkIfFavorite() {
    if (this.authService.isAuthenticated() && this.product?.id) {
      try {
        this.isFavorite = await this.favoritesService.isFavorite(this.product.id);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    }
  }

  async toggleFavorite(event: Event) {
    event.stopPropagation();
    if (this.isLoading) return;

    this.isLoading = true;

    try {
      if (!this.authService.isAuthenticated()) {
        alert('Debes iniciar sesión para guardar productos en favoritos');
        return;
      }

      const result = await this.favoritesService.toggleFavorite(this.product.id);
      alert(result.message);
      this.isFavorite = !this.isFavorite;
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al actualizar favoritos');
    } finally {
      this.isLoading = false;
    }
  }
}