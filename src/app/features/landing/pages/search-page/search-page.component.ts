import { FavoritesService } from './../../../../core/services/favorites/favorites.service';
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  Input,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
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
  ProductVariant
} from '../../../../shared/utils/models/Products-supabase.interface';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CardproductComponent } from '../../../../shared/components/generic/cardproduct/cardproduct.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, RouterModule, CardproductComponent],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SearchPageComponent implements AfterViewInit, OnDestroy {
  chars: string[] = [];
  inputWidth: number = 150;
  selectedColors: Record<string, string> = {};
  searchTerm: string = '';
  loading: boolean = false;
  products: Product[] = [];
  noResults: boolean = false;
  @Input() product!: Product;
  selectedCategory: string | null = null;
  selectedSubcategory: string | null = null;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @ViewChild('animatedText') animatedText!: ElementRef<HTMLDivElement>;
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('fakeInput') fakeInput!: ElementRef<HTMLDivElement>;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private favoritesService: FavoritesService,
    @Inject(PLATFORM_ID) private platformId: Object
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

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const { data, error } = await this.supabase.getProducts();

    if (error) {
      console.error('Error al obtener productos', error);
      this.loading = false;
      return;
    }

    const search = this.searchTerm.toLowerCase();

    const filtered = (data as any[]).filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.categories?.name?.toLowerCase().includes(search) ||
      p.subcategories?.name?.toLowerCase().includes(search)
    );

    this.products = filtered.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      details: p.details || '',
      price: p.price || 0,
      variants: p.product_variants || [],
      main_image: p.main_image || '',
      additional_images: p.additional_images || [],
      sizes: p.sizes || [],
      slug: p.slug || '',
      category: p.categories,
      subcategory: p.subcategories,
      wishlisted: false
    }));

    this.noResults = this.products.length === 0;
    this.loading = false;

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  onColorSelected(event: { productId: string; color: string }): void {
    this.selectedColors[event.productId] = event.color;
    
    const product = this.products.find(p => p.id === event.productId);
    if (product) {
      const variant = product.variants.find(v => v.color_name === event.color);
      if (variant) {
        // Actualizar la imagen del producto si es necesario
      }
    }
    
    this.updateQueryParamsWithoutReload();
  }

  onWishlistToggled(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.wishlisted = !product.wishlisted;
    }
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

  trackByProductId(index: number, product: Product): string {
    return product.slug;
  }
}