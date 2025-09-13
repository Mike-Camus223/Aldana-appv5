import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { Product } from '../../../../shared/utils/models/Products-supabase.interface';
import { CardproductComponent } from '../../../../shared/components/generic/cardproduct/cardproduct.component';

@Component({
  selector: 'app-whitelist',
  standalone: true,
  imports: [CommonModule, CardproductComponent],
  templateUrl: './whitelist.component.html',
  styleUrls: ['./whitelist.component.css']
})
export class WhitelistComponent {
  private favoritesService = inject(FavoritesService);
  favorites$: Observable<Product[]>;

  constructor() {
    this.favorites$ = this.favoritesService.getFavorites();
  }

  removeFromFavorites(productId: string): void {
    this.favoritesService.removeFavorite(productId).subscribe(() => {
      // Opcional: añadir feedback al usuario, como un toast.
      // La lista se actualizará automáticamente gracias a los observables.
      console.log(`Product ${productId} removed from favorites`);
    });
  }
}
