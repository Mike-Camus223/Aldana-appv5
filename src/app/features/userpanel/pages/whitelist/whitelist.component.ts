import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { PaginatorComponent } from '../../../../shared/components/generic/paginator/paginator.component';
import gsap from 'gsap';
import {
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  ShoppingBag,
  Trash2
} from 'lucide-angular';

@Component({
  selector: 'app-whitelist',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SelectsComponent, PaginatorComponent],
  templateUrl: './whitelist.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LayoutGrid,
        List,
        ShoppingBag,
        Trash2,
        Check,
        ChevronDown
      })
    }
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./whitelist.component.css']
})
export class WhitelistComponent implements OnInit, OnDestroy {
  @ViewChild('viewContainer') viewContainerRef?: ElementRef;

  favorites: any[] = [];
  isLoading = true;
  viewMode: 'grid' | 'list' = 'grid';
  selectedSort: string = 'recent';
  selectedIds: Set<string> = new Set<string>();
  isSelectionMode: boolean = false;
  isDeleting: boolean = false;
  private hasInitialAnimationPlayed = false;

  readonly pageSize = 16;
  currentPage = 1;

  sortOptions = [
    { label: 'Más recientes', value: 'recent' },
    { label: 'Más antiguas', value: 'oldest' },
    { label: 'Mayor precio', value: 'highest' },
    { label: 'Menor precio', value: 'lowest' },
    { label: 'Nombre A-Z', value: 'name_asc' },
    { label: 'Nombre Z-A', value: 'name_desc' }
  ];

  private isBrowser: boolean;
  private destroy$ = new Subject<void>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.favorites.length / this.pageSize));
  }

  get paginatedFavorites(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.favorites.slice(start, start + this.pageSize);
  }

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.isLoading = false;
      this.favorites = [];
      return;
    }

    this.isLoading = true;
    this.favoritesService.refreshFavorites();

    this.favoritesService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (favorites) => {
          this.favorites = (favorites || [])
            .filter(fav => fav && (fav.product || fav.product_id))
            .map(fav => ({
              ...fav,
              product: fav.product
                ? { ...fav.product, wishlisted: true }
                : { id: fav.product_id, name: 'Producto', price: 0, wishlisted: true }
            }));

          this.applySort();
          this.cleanSelectedIds();
          this.isLoading = false;
          this.cdr.markForCheck();

          // Solo se ejecuta una única vez al entrar / cargar la sección
          if (this.favorites.length > 0 && !this.hasInitialAnimationPlayed) {
            this.hasInitialAnimationPlayed = true;
            this.animateCardsIn();
          }
        },
        error: (error) => {
          console.error('Error loading favorites:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onSortChange(sort: string) {
    this.selectedSort = sort;
    this.applySort();
    this.currentPage = 1;
    this.animateCardsIn();
  }

  private applySort() {
    if (!this.favorites || !this.favorites.length) return;

    if (this.selectedSort === 'recent') {
      this.favorites.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (this.selectedSort === 'oldest') {
      this.favorites.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    } else if (this.selectedSort === 'highest') {
      this.favorites.sort((a, b) => (b.product?.price || 0) - (a.product?.price || 0));
    } else if (this.selectedSort === 'lowest') {
      this.favorites.sort((a, b) => (a.product?.price || 0) - (b.product?.price || 0));
    } else if (this.selectedSort === 'name_asc') {
      this.favorites.sort((a, b) => (a.product?.name || '').localeCompare(b.product?.name || ''));
    } else if (this.selectedSort === 'name_desc') {
      this.favorites.sort((a, b) => (b.product?.name || '').localeCompare(a.product?.name || ''));
    }
  }

  // --- Paginación ---

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.markForCheck();
      this.animateCardsIn();
    }
  }

  // --- Animación GSAP de entrada de cards (uno por uno de izq a derecha) ---

  switchViewMode(mode: 'grid' | 'list') {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    this.cdr.markForCheck();
    this.animateCardsIn();
  }

  private animateCardsIn() {
    if (!this.isBrowser) return;

    setTimeout(() => {
      const container = this.viewContainerRef?.nativeElement;
      if (!container) return;

      const cards = container.querySelectorAll('.fav-card');
      if (!cards || !cards.length) return;

      const images = container.querySelectorAll('.fav-card-img');

      gsap.killTweensOf(cards);
      gsap.set(cards, { opacity: 0, y: 35 });

      if (images.length) {
        gsap.killTweensOf(images);
        gsap.set(images, { scale: 1.06 });
      }

      // Animación en cascada uno por uno de izquierda a derecha
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.08
      });

      if (images.length) {
        gsap.to(images, {
          scale: 1.0,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.08
        });
      }
    }, 60);
  }

  // --- Selección múltiple ---

  getProductId(fav: any): string {
    return fav?.product?.id || fav?.product_id || fav?.id || '';
  }

  isAllSelected(): boolean {
    if (!this.paginatedFavorites.length) return false;
    return this.paginatedFavorites.every(fav => {
      const id = this.getProductId(fav);
      return id && this.selectedIds.has(id);
    });
  }

  toggleSelectAll() {
    if (!this.isSelectionMode) {
      this.isSelectionMode = true;
      this.paginatedFavorites.forEach(fav => {
        const id = this.getProductId(fav);
        if (id) this.selectedIds.add(id);
      });
    } else {
      if (this.isAllSelected()) {
        this.selectedIds.clear();
        this.isSelectionMode = false;
      } else {
        this.paginatedFavorites.forEach(fav => {
          const id = this.getProductId(fav);
          if (id) this.selectedIds.add(id);
        });
      }
    }
  }

  toggleSelectItem(productId: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!productId) return;

    if (this.selectedIds.has(productId)) {
      this.selectedIds.delete(productId);
    } else {
      this.selectedIds.add(productId);
    }
  }

  isSelected(productId: string): boolean {
    return this.selectedIds.has(productId);
  }

  cancelSelection() {
    this.selectedIds.clear();
    this.isSelectionMode = false;
  }

  private cleanSelectedIds() {
    const existingIds = new Set(this.favorites.map(f => this.getProductId(f)).filter(Boolean));
    this.selectedIds.forEach(id => {
      if (!existingIds.has(id)) {
        this.selectedIds.delete(id);
      }
    });
    if (this.selectedIds.size === 0 && !this.isSelectionMode) {
      this.isSelectionMode = false;
    }
  }

  // --- Eliminación con NotificationService ---

  async removeSingleFavorite(event: Event, productId: string, productName?: string) {
    event.stopPropagation();
    if (!productId || this.isDeleting) return;

    this.isDeleting = true;
    try {
      await this.favoritesService.toggleFavorite(productId);
      this.selectedIds.delete(productId);
      this.notificationService.showSuccess(
        'Eliminado con éxito',
        productName ? `"${productName}" eliminado de favoritos` : 'Producto eliminado de la lista de favoritos',
        3000
      );
    } catch (error) {
      console.error('Error removing favorite:', error);
      this.notificationService.showError('Error', 'No se pudo eliminar el producto de favoritos', 3000);
    } finally {
      this.isDeleting = false;
    }
  }

  async removeSelectedFavorites() {
    const count = this.selectedIds.size;
    if (!count || this.isDeleting) return;

    this.isDeleting = true;
    try {
      const idsArray = Array.from(this.selectedIds);
      await this.favoritesService.removeMultipleFavorites(idsArray);
      this.selectedIds.clear();
      this.isSelectionMode = false;
      this.notificationService.showSuccess(
        'Elementos eliminados',
        count === 1 ? 'Producto eliminado de favoritos' : `${count} productos eliminados de la lista de favoritos`,
        3000
      );
    } catch (error) {
      console.error('Error removing selected favorites:', error);
      this.notificationService.showError('Error', 'No se pudieron eliminar los productos seleccionados', 3000);
    } finally {
      this.isDeleting = false;
    }
  }

  // --- Navegación y formateo ---

  navigateToProduct(slug?: string) {
    if (slug) {
      this.router.navigate(['/producto', slug]);
    }
  }

  navigateToStore() {
    this.router.navigate(['/tienda']);
  }

  formatPrice(price: number): string {
    if (price === undefined || price === null || isNaN(price)) return '$ 0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(price);
  }

  ngOnDestroy() {
    if (this.viewContainerRef?.nativeElement) {
      const cards = this.viewContainerRef.nativeElement.querySelectorAll('.fav-card');
      if (cards.length) gsap.killTweensOf(cards);
      const images = this.viewContainerRef.nativeElement.querySelectorAll('.fav-card-img');
      if (images.length) gsap.killTweensOf(images);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}