import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import gsap from 'gsap';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil
} from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  Product,
  ProductVariant,
  ProductImage
} from '../../../../shared/utils/models/Products-supabase.interface';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, RouterModule],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements AfterViewInit, OnDestroy {
  chars: string[] = [];
  inputWidth: number = 150;
  selectedColors: Record<string, string> = {};
  searchTerm: string = '';
  loading: boolean = false;
  products: Product[] = [];
  noResults: boolean = false;
  selectedCategory: string | null = null;
  selectedSubcategory: string | null = null;
  private wishlistKey = 'wishlistProducts';

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @ViewChild('animatedText') animatedText!: ElementRef<HTMLDivElement>;
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fakeInput') fakeInput!: ElementRef<HTMLDivElement>;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngAfterViewInit() {
    this.updateInputWidth();

    this.searchSubject
      .pipe(
        debounceTime(1400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.searchTerm.trim().length > 0) {
          this.fetchProducts();
        } else {
          this.products = [];
          this.noResults = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.searchTerm = input;
    const oldLength = this.chars.length;
    const newLength = input.length;

    if (newLength < oldLength) {
      this.chars.splice(newLength);
    } else {
      const newChar = input[newLength - 1];
      this.chars.push(newChar);

      setTimeout(() => {
        const span = this.animatedText.nativeElement.children[newLength - 1];
        if (span) {
          gsap.fromTo(span, { x: '8px' }, { x: '0px', duration: 0.2, ease: 'power1.out' });
        }
        this.scrollContainer.nativeElement.scrollLeft =
          this.scrollContainer.nativeElement.scrollWidth;
      }, 0);
    }

    this.updateInputWidth();
    this.searchSubject.next(this.searchTerm);
  }

  updateInputWidth() {
    setTimeout(() => {
      const scroll = this.scrollContainer.nativeElement.scrollWidth;
      this.inputWidth = Math.min(scroll + 50, window.innerWidth * 0.9);
    }, 0);
  }

  async fetchProducts() {
    this.loading = true;
    this.noResults = false;
    this.products = [];

    // Mantener el scroll arriba mientras se busca
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const { data, error } = await this.supabase.getProducts();
    if (error) {
      console.error('Error al obtener productos', error);
      this.loading = false;
      return;
    }

    const search = this.searchTerm.toLowerCase();

    const filtered = (data as any[]).filter(product =>
      product.name?.toLowerCase().includes(search) ||
      product.categories?.name?.toLowerCase().includes(search) ||
      product.subcategories?.name?.toLowerCase().includes(search)
    );

    this.products = this.mapProducts(filtered);
    this.noResults = this.products.length === 0;
    this.loading = false;

    // Asegurar que permanezca arriba después de mostrar resultados
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  private mapProducts(data: any[]): Product[] {
    return data.map(p => {
      const variants: ProductVariant[] = p.product_variants || [];
      const colors = [...new Set(variants.map(v => v.color))];
      const allImages: ProductImage[] = variants.flatMap(v => v.product_images || []);
      const mainImage = allImages.find(img => img.is_main) || allImages[0] || { image_url: '' };

      return {
        id: p.id,
        name: p.name,
        details: p.details || '',
        description: p.description,
        price: p.price || 0,
        variants,
        product_images: allImages,
        mainImageUrl: mainImage.image_url,
        colors,
        wishlisted: false,
        category: p.categories?.name?.toLowerCase() || '',
        subcategory: p.subcategories?.name?.toLowerCase() || ''
      };
    });
  }

  // Método para navegar al producto con mejor compatibilidad móvil
  navigateToProduct(productId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Usar setTimeout para asegurar que la navegación ocurra después del evento
    setTimeout(() => {
      this.router.navigate(['/producto', productId]);
    }, 0);
  }

  async selectColor(productId: string, color: string, event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (this.selectedColors[productId] === color) return;
    this.selectedColors[productId] = color;

    const product = this.products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.color === color);
    const img = variant?.product_images.find(i => i.is_main) || variant?.product_images[0];
    if (product && img) product.mainImageUrl = img.image_url;

    this.updateQueryParamsWithoutReload();
  }

  toggleWishlist(product: Product): void {
    product.wishlisted = !product.wishlisted;
    this.saveWishlistToStorage();
  }

  private updateQueryParamsWithoutReload(): void {
    const queryParams: any = {
      categoria: this.selectedCategory || null,
      subcategoria: this.selectedSubcategory || null
    };

    const colorFilters = Object.entries(this.selectedColors)
      .filter(([_, color]) => !!color)
      .map(([id, color]) => `${id}:${color}`);
    if (colorFilters.length > 0) {
      queryParams.colores = colorFilters.join(',');
    }

    const newUrl = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    }).toString();
    window.history.replaceState({}, '', newUrl);
  }

  private saveWishlistToStorage(): void {
    const wishlistedIds = this.products.filter(p => p.wishlisted).map(p => p.id);
    localStorage.setItem(this.wishlistKey, JSON.stringify(wishlistedIds));
  }

  trackByProductId(index: number, product: Product): string {
    return product.id;
  }
}