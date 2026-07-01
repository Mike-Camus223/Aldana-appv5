import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  Input,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Product } from '../../../../shared/utils/models/Products-supabase.interface';
import { CardproductComponent } from '../../../../shared/components/generic/cardproduct/cardproduct.component';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, ChevronDown, Search } from 'lucide-angular';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ProductUtils } from '../../../../shared/utils/dataEx/products-utils';
import { LinkHoverUnderlineDirective } from '../../../../shared/utils/directives/link-hover-underline.directive';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { ProductsService } from '../../../../core/services/data-access/products/products.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardproductComponent,
    FormsModule,
    LucideAngularModule,
    LinkHoverUnderlineDirective
  ],
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [
    trigger('gridAnimation', [
      transition('* => *', [
        style({ transform: 'scale(0.98)', opacity: 0.8 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
    trigger('contentFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(4px)' })),
      ]),
    ]),
    trigger('cardWaveAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardEnterAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronDown, Search })
    }
  ]
})
export class SearchPageComponent implements OnInit, OnDestroy {
  selectedColors: Record<string, string> = {};
  searchTerm: string = '';
  displayedSearchTerm: string = ''; // Store the search term used for the current results
  recentSearches: string[] = [];
  loading: boolean = false;
  products: Product[] = []; // Filtered products for display
  originalProducts: Product[] = []; // Raw search results
  noResults: boolean = false;
  hasSearched: boolean = false;
  searchMode: 'input' | null = null;
  @Input() product!: Product;

  // Layout Properties
  productColumns: number = 4;

  // Pagination Properties
  itemsPerPage: number = 16;
  currentPage: number = 1;
  pagesArray: number[] = [];

  sortOption: string = 'relevance';
  sortOptions = [
    { label: 'Relevancia', value: 'relevance' },
    { label: 'Menor Precio', value: 'price_asc' },
    { label: 'Mayor Precio', value: 'price_desc' },
    { label: 'Nombre A-Z', value: 'name_asc' },
    { label: 'Nombre Z-A', value: 'name_desc' }
  ];

  private destroy$ = new Subject<void>();
  private readonly RECENT_KEY = 'recent_searches';

  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('productsContainer') productsContainerRef?: ElementRef<HTMLDivElement>;

  constructor(
    private productsService: ProductsService,
    private bridesProductsService: BridesProductsService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.loadRecentSearches();
    // Initialize state from query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      // Search Term
      if (params['q']) {
        this.searchTerm = params['q'];
      } else {
        this.searchTerm = '';
      }

      // Sort
      if (params['sort']) {
        this.sortOption = params['sort'];
      } else {
        this.sortOption = 'relevance';
      }

      if (this.searchTerm) {
        this.hasSearched = true;
        this.searchMode = 'input';
        this.fetchProducts();
      } else {
        this.hasSearched = false;
        this.searchMode = null;
        this.products = [];
        this.originalProducts = [];
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
  }

  updateUrl() {
    const queryParams: any = {
      q: (this.searchTerm && this.searchTerm.trim().length) ? this.searchTerm : null,
      sort: (this.sortOption && this.sortOption !== 'relevance') ? this.sortOption : null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  async fetchProducts() {
    this.loading = true;
    this.noResults = false;

    // Handle empty search input
    if (!this.searchTerm || !this.searchTerm.trim()) {
      await new Promise<void>(resolve => setTimeout(resolve, 1000)); // Show spinner for 1 second
      this.loading = false;
      this.hasSearched = false;
      this.originalProducts = [];
      this.products = [];
      return;
    }

    // Store the search term that will be used for displaying results
    this.displayedSearchTerm = this.searchTerm;

    const delayMin = new Promise<void>(resolve => setTimeout(resolve, 1000));

    // Fetch from both normal and bridal modules
    const [normalRes, bridalRes] = await Promise.all([
      this.productsService.getProducts(),
      this.bridesProductsService.getProducts(),
      delayMin
    ]);

    if (normalRes.error) {
      console.error('Error al obtener productos normales', normalRes.error);
    }
    if ((bridalRes as any)?.error) {
      console.error('Error al obtener productos de novias', (bridalRes as any).error);
    }

    const normalData = normalRes.data || [];
    const bridalData = (bridalRes as any)?.data || [];

    const mappedNormal = ProductUtils.mapProducts(Array.isArray(normalData) ? normalData : [normalData], false);
    const mappedBridal = ProductUtils.mapProducts(Array.isArray(bridalData) ? bridalData : [bridalData], true).map(p => ({
      ...p,
      source_module: 'bridal'
    }));

    const allProducts = [...mappedNormal, ...mappedBridal];

    const search = this.searchTerm.toLowerCase();
    const rawProducts = allProducts.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.category?.name?.toLowerCase().includes(search) ||
      p.subcategory?.name?.toLowerCase().includes(search)
    );

    this.originalProducts = rawProducts;
    this.products = [...rawProducts];

    // Reset pagination when new search results are loaded
    this.currentPage = 1;

    // Sort products based on sortOption
    this.sortProducts();

    this.loading = false;
    this.noResults = this.products.length === 0;
  }

  sortProducts() {
    if (!this.products.length) return;

    switch (this.sortOption) {
      case 'price_asc':
        this.products.sort((a, b) => this.getProductPrice(a) - this.getProductPrice(b));
        break;
      case 'price_desc':
        this.products.sort((a, b) => this.getProductPrice(b) - this.getProductPrice(a));
        break;
      case 'name_asc':
        this.products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        this.products.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      default: // relevance
        // Restore original search matching order
        this.products = [...this.originalProducts];
        break;
    }
    // Update pagination after sorting
    this.updatePagination();
  }

  // --- Pagination Methods ---
  get totalPages(): number {
    const total = Math.ceil((this.products.length || 0) / this.itemsPerPage);
    return Math.max(1, total);
  }

  private updatePagination(): void {
    // clamp current page
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    // build pages array
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // Get products for current page
  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.products.slice(start, end);
  }

  onSortChange(event: any) {
    this.sortOption = event.target.value;
    this.sortProducts();
    this.updateUrl();
  }

  setProductColumns(cols: number): void {
    if (cols >= 2 && cols <= 4) {
      this.productColumns = cols;
    }
  }

  applyFiltersAction(isMobile: boolean) {
    if (this.loading) {
      return;
    }
    const term = (this.searchTerm || '').trim();
    if (term.length > 0) {
      this.saveRecentSearch(term);
    }
    if (term.length > 0) {
      this.hasSearched = true;
      this.searchMode = 'input';
      this.updateUrl();
      this.fetchProducts();
    } else {
      // Show spinner for empty search, then reset to default state
      this.loading = true;
      setTimeout(() => {
        this.hasSearched = false;
        this.searchMode = null;
        this.products = [];
        this.originalProducts = [];
        this.noResults = false;
        this.loading = false;
        this.updateUrl();
      }, 1000); // Show spinner for 1 second
    }
  }

  private loadRecentSearches(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(this.RECENT_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) {
        this.recentSearches = arr.filter((x: any) => typeof x === 'string').slice(0, 5);
      }
    } catch { }
  }

  private saveRecentSearch(term: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const t = String(term).trim();
    if (!t) return;
    const existing = this.recentSearches.filter(s => s.toLowerCase() !== t.toLowerCase());
    this.recentSearches = [t, ...existing].slice(0, 5);
    try {
      localStorage.setItem(this.RECENT_KEY, JSON.stringify(this.recentSearches));
    } catch { }
  }

  onRecentClick(term: string): void {
    this.searchTerm = term;
    this.applyFiltersAction(false);
  }

  // --- Helpers ---
  private getProductPrice(p: Product): number {
    const anyP: any = p as any;
    const candidates = [anyP.price, anyP.price_ars, anyP.price_value, anyP.priceUsd];
    const found = candidates.find(v => typeof v === 'number');
    if (typeof found === 'number') return found;
    if (Array.isArray(anyP.variants)) {
      const vFound = anyP.variants.find((v: any) => typeof v?.price === 'number');
      if (vFound) return Number(vFound.price);
    }
    return 0;
  }

  trackByProductId(index: number, product: Product): string {
    return product.id || product.slug;
  }

  onColorSelected(event: { productId: string; color: string }): void {
    this.selectedColors[event.productId] = event.color;
    const product = this.products.find(p => p.id === event.productId);
    if (product) {
      const variant = product.variants.find(v => v.color_name === event.color);
      if (variant?.main_image) {
        product.main_image = variant.main_image;
      }
    }
  }

  onWishlistToggled(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.wishlisted = !product.wishlisted;
    }
  }
}
