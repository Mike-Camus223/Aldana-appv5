import { FavoritesService } from './../../../../core/services/favorites/favorites.service';
import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  Input,
  CUSTOM_ELEMENTS_SCHEMA,
  HostListener,
  OnInit
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
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
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Funnel, ChevronDown, ChevronUp, Search } from 'lucide-angular';
import { AcordiongenericComponent } from '../../../../shared/components/generic/acordiongeneric/acordiongeneric.component';
import { AldyCheckboxV1Directive } from '../../../../shared/utils/directives/aldy-checkbox-v1.directive';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { ProductUtils } from '../../../../shared/utils/dataEx/products-utils';
import { LinkHoverUnderlineDirective } from '../../../../shared/utils/directives/link-hover-underline.directive';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    CardproductComponent,
    FormsModule,
    CheckboxModule,
    SliderModule,
    LucideAngularModule,
    AcordiongenericComponent,
    AldyCheckboxV1Directive,
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
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Funnel, ChevronDown, ChevronUp,Search })
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
  searchMode: 'input' | 'filters' | null = null;
  @Input() product!: Product;
  filterDescription: string = '';
  
  // Filter & Layout Properties
  showFilters = false;
  isMobileView = false;
  productColumns: number = 4;
  
  sortOption: string = 'relevance';
  sortOptions = [
    { label: 'Relevancia', value: 'relevance' },
    { label: 'Menor Precio', value: 'price_asc' },
    { label: 'Mayor Precio', value: 'price_desc' },
    { label: 'Nombre A-Z', value: 'name_asc' },
    { label: 'Nombre Z-A', value: 'name_desc' }
  ];

  selectedCategories: string[] = [];
  selectedSubcategoriesMap: Record<string, string[]> = {};
  allowedSizes: string[] = ['S', 'M', 'L'];
  selectedSizes: string[] = [];

  // Price
  priceRange: number[] = [0, 500000];
  priceMin: number = 0;
  priceMax: number = 500000;
  maxPriceLimit: number = 500000;

  openAccordions: Set<string> = new Set(['categorias']);
  get openAccordionsArray(): string[] { return Array.from(this.openAccordions); }
  
  // Accordion Toggles
  pretAPorterOpen = false;
  noviasOpen = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private readonly RECENT_KEY = 'recent_searches';
  private lastSearchSignature: string | null = null;

  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('productsContainer') productsContainerRef?: ElementRef<HTMLDivElement>;

  // Dynamic filters
  visibleCategories: any[] = []; // Fallback/Generic
  visiblePretCategories: any[] = [];
  visibleNoviasCategories: any[] = [];

  // Static Categories Definitions (from StoreTemplate)
  categories = [
    {
      label: 'Camisas', value: 'camisas', subsections: [
        { label: 'Camisas 1', value: 'camisas 1' },
        { label: 'Camisas 2', value: 'camisas 2' },
        { label: 'Camisas 3', value: 'camisas 3' }
      ]
    },
    {
      label: 'Blusas', value: 'blusas', subsections: [
        { label: 'Blusas 1', value: 'blusas 1' },
        { label: 'Blusas 2', value: 'blusas 2' },
        { label: 'Blusas 3', value: 'blusas 3' }
      ]
    },
    {
      label: 'Faldas', value: 'faldas', subsections: [
        { label: 'Faldas 1', value: 'faldas 1' },
        { label: 'Faldas 2', value: 'faldas 2' },
        { label: 'Faldas 3', value: 'faldas 3' }
      ]
    },
    {
      label: 'Pantalón', value: 'pantalon', subsections: [
        { label: 'Pantalón 1', value: 'pantalon 1' },
        { label: 'Pantalón 2', value: 'pantalon 2' },
        { label: 'Pantalón 3', value: 'pantalon 3' }
      ]
    },
    {
      label: 'Abrigos', value: 'abrigos', subsections: [
        { label: 'Campera', value: 'campera' },
        { label: 'Buzos', value: 'buzos' },
        { label: 'Chalecos', value: 'chalecos' },
        { label: 'Blazers', value: 'blazers' },
        { label: 'Tapados', value: 'tapados' }
      ]
    },
    {
      label: 'Vestidos', value: 'vestidos', subsections: [
        { label: 'Vestidos 1', value: 'vestidos 1' },
        { label: 'Vestidos 2', value: 'vestidos 2' },
        { label: 'Vestidos 3', value: 'vestidos 3' }
      ]
    },
    {
      label: 'Remeras', value: 'remeras', subsections: [
        { label: 'Remeras 1', value: 'remeras 1' },
        { label: 'Remeras 2', value: 'remeras 2' },
        { label: 'Remeras 3', value: 'remeras 3' }
      ]
    }
  ];

  pretAPorterCategories = [
    {
      label: 'Camisas', value: 'camisas', subsections: [
        { label: 'Camisas 1', value: 'camisas 1' },
        { label: 'Camisas 2', value: 'camisas 2' },
        { label: 'Camisas 3', value: 'camisas 3' }
      ]
    },
    {
      label: 'Blusas', value: 'blusas', subsections: [
        { label: 'Blusas 1', value: 'blusas 1' },
        { label: 'Blusas 2', value: 'blusas 2' },
        { label: 'Blusas 3', value: 'blusas 3' }
      ]
    },
    {
      label: 'Faldas', value: 'faldas', subsections: [
        { label: 'Faldas 1', value: 'faldas 1' },
        { label: 'Faldas 2', value: 'faldas 2' },
        { label: 'Faldas 3', value: 'faldas 3' }
      ]
    },
    {
      label: 'Pantalón', value: 'pantalon', subsections: [
        { label: 'Pantalón 1', value: 'pantalon 1' },
        { label: 'Pantalón 2', value: 'pantalon 2' },
        { label: 'Pantalón 3', value: 'pantalon 3' }
      ]
    },
    {
      label: 'Abrigos', value: 'abrigos', subsections: [
        { label: 'Campera', value: 'campera' },
        { label: 'Buzos', value: 'buzos' },
        { label: 'Chalecos', value: 'chalecos' },
        { label: 'Blazers', value: 'blazers' },
        { label: 'Tapados', value: 'tapados' }
      ]
    },
    {
      label: 'Vestidos', value: 'vestidos', subsections: [
        { label: 'Vestidos 1', value: 'vestidos 1' },
        { label: 'Vestidos 2', value: 'vestidos 2' },
        { label: 'Vestidos 3', value: 'vestidos 3' }
      ]
    },
    {
      label: 'Remeras', value: 'remeras', subsections: [
        { label: 'Remeras 1', value: 'remeras 1' },
        { label: 'Remeras 2', value: 'remeras 2' },
        { label: 'Remeras 3', value: 'remeras 3' }
      ]
    }
  ];

  noviasCategories = [
    {
      label: 'Vestidos de Novia', value: 'vestidos de novia', subsections: [
        { label: 'Vestidos de Novia 1', value: 'vestidos de novia 1' },
        { label: 'Vestidos de Novia 2', value: 'vestidos de novia 2' },
        { label: 'Vestidos de Novia 3', value: 'vestidos de novia 3' }
      ]
    },
    {
      label: 'Velos', value: 'velos', subsections: [
        { label: 'Velos 1', value: 'velos 1' },
        { label: 'Velos 2', value: 'velos 2' },
        { label: 'Velos 3', value: 'velos 3' }
      ]
    }
  ];

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private favoritesService: FavoritesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    this.checkMobileView();
    this.loadRecentSearches();
    // Initialize state from query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
        // Search Term
        if (params['q']) {
            this.searchTerm = params['q'];
        }

        // Sort
        if (params['sort']) {
            this.sortOption = params['sort'];
        }

        // Categories
        if (params['categorias']) {
            const cats = params['categorias'].split(',').map((c: string) => ProductUtils.normalize(c)).filter(Boolean);
            this.selectedCategories = cats;
        }

        // Subcategories
        if (params['subcategorias']) {
            const subs = params['subcategorias'].split(',').map((s: string) => ProductUtils.normalize(s)).filter(Boolean);
            // We need to map subs back to parents for the map.
            // This is tricky without knowing the parent. 
            // We will attempt to reconstruct logic in fetchProducts or just store flat.
            // For now, let's rely on applyFilters handling "flat" logic or we rebuild map later.
            // Ideally, we rebuild map.
            this.rebuildSubcategoriesMap(subs);
        }

        // Sizes
        if (params['tamanos']) {
            this.selectedSizes = params['tamanos'].split(',').map((s: string) => String(s).toUpperCase());
        }

        // Price
        if (params['precio_min'] || params['precio_max']) {
             const min = params['precio_min'] ? Number(params['precio_min']) : 0;
             const max = params['precio_max'] ? Number(params['precio_max']) : 500000;
             this.priceMin = min;
             this.priceMax = max;
             this.priceRange = [min, max];
        }

        const hasFilters = (
          (params['categorias'] && params['categorias'].length) ||
          (params['subcategorias'] && params['subcategorias'].length) ||
          (params['tamanos'] && params['tamanos'].length) ||
          params['precio_min'] !== undefined ||
          params['precio_max'] !== undefined
        );

        if (this.searchTerm || hasFilters) {
            this.hasSearched = true;
            this.searchMode = this.searchTerm ? 'input' : 'filters';
            this.fetchProducts();
        } else {
            this.hasSearched = false;
            this.searchMode = null;
        }
    });
  }

  rebuildSubcategoriesMap(subs: string[]) {
      this.selectedSubcategoriesMap = {};
      const allCats = [...this.pretAPorterCategories, ...this.noviasCategories];
      
      subs.forEach(sub => {
          // Find parent
          const parent = allCats.find(c => 
              c.subsections?.some(s => ProductUtils.normalize(s.value) === sub)
          );
          if (parent) {
              const pVal = ProductUtils.normalize(parent.value);
              if (!this.selectedSubcategoriesMap[pVal]) {
                  this.selectedSubcategoriesMap[pVal] = [];
              }
              if (!this.selectedSubcategoriesMap[pVal].includes(sub)) {
                  this.selectedSubcategoriesMap[pVal].push(sub);
              }
              // Ensure parent is selected? Usually yes.
              if (!this.selectedCategories.includes(pVal)) {
                  this.selectedCategories.push(pVal);
              }
          }
      });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobileView();
      if (!this.isMobileView && this.showFilters) {
        this.showFilters = false;
      }
    }
  }

  checkMobileView(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth < 1024;
    }
  }

  onInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.searchTerm = input;
  }

  updateUrl() {
      const subs = this.getSelectedSubcategoriesFlat().map(s => s.subcategory);
      const queryParams: any = {
          q: (this.searchTerm && this.searchTerm.trim().length) ? this.searchTerm : null,
          sort: (this.sortOption && this.sortOption !== 'relevance') ? this.sortOption : null,
          categorias: this.selectedCategories.length > 0 ? this.selectedCategories.join(',') : null,
          subcategorias: subs.length > 0 ? subs.join(',') : null,
          tamanos: this.selectedSizes.length > 0 ? this.selectedSizes.join(',') : null,
          precio_min: this.priceMin > 0 ? this.priceMin : null,
          precio_max: this.priceMax < this.maxPriceLimit ? this.priceMax : null,
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
    if (this.searchMode === 'input' && (!this.searchTerm || !this.searchTerm.trim())) {
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
    const { data, error } = await this.supabase.getProducts();
    await delayMin;

    if (error) {
      console.error('Error al obtener productos', error);
      this.loading = false;
      return;
    }

    let rawProducts: any[] = [];
    if (this.searchMode === 'filters') {
      rawProducts = (data as any[]) || [];
    } else {
      const search = this.searchTerm.toLowerCase();
      rawProducts = (data as any[]).filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.categories?.name?.toLowerCase().includes(search) ||
        p.subcategories?.name?.toLowerCase().includes(search)
      );
    }

    this.originalProducts = ProductUtils.mapProducts(rawProducts);
    
    // Extract filters based on original products (search results)
    this.extractFiltersFromProducts();
    
    // Apply filters to populate this.products
    this.applyFilters();
    
    this.loading = false;
    this.noResults = this.products.length === 0;
  }

  extractFiltersFromProducts() {
    if (this.searchMode === 'filters') {
        this.visiblePretCategories = this.pretAPorterCategories;
        this.visibleNoviasCategories = this.noviasCategories;
        this.visibleCategories = [...this.visiblePretCategories, ...this.visibleNoviasCategories];
        return;
    }

    if (this.originalProducts.length === 0) {
        this.visibleCategories = [];
        this.visiblePretCategories = [];
        this.visibleNoviasCategories = [];
        this.allowedSizes = [];
        return;
    }

    // 1. Extract Categories & Subcategories
    const usedCategories = new Set<string>();
    const usedSubcategories = new Set<string>(); // "category|subcategory"
    
    // 2. Extract Sizes
    const usedSizes = new Set<string>();
    
    // 3. Extract Prices
    let minP = Number.MAX_VALUE;
    let maxP = 0;

    this.originalProducts.forEach(p => {
        // Categories
        const cName = ProductUtils.normalize(p.category?.name || '');
        if (cName) usedCategories.add(cName);
        
        const sName = ProductUtils.normalize(p.subcategory?.name || '');
        if (cName && sName) usedSubcategories.add(`${cName}|${sName}`);

        // Sizes
        const pSizes = this.getProductSizes(p);
        pSizes.forEach(s => usedSizes.add(s));

        // Prices
        const price = this.getProductPrice(p);
        if (price < minP) minP = price;
        if (price > maxP) maxP = price;
    });

    // Helper to filter category lists
    const filterCatList = (list: any[]) => {
        return list
            .filter(catData => usedCategories.has(ProductUtils.normalize(catData.value)))
            .map(catData => {
                const catNorm = ProductUtils.normalize(catData.value);
                const visibleSubs = (catData.subsections || []).filter((sub: any) => {
                    const subNorm = ProductUtils.normalize(sub.value);
                    return usedSubcategories.has(`${catNorm}|${subNorm}`);
                });
                return {
                    ...catData,
                    subsections: visibleSubs
                };
            });
    };

    // Update Visible Categories
    this.visiblePretCategories = filterCatList(this.pretAPorterCategories);
    this.visibleNoviasCategories = filterCatList(this.noviasCategories);
    
    // Fallback if needed, or just combine for mobile if simpler
    this.visibleCategories = [...this.visiblePretCategories, ...this.visibleNoviasCategories];

    // Update Allowed Sizes
    this.allowedSizes = Array.from(usedSizes).sort();

    // Precio fijo: no limitado por productos
    this.maxPriceLimit = 500000;
    if (this.priceMin === 0 && this.priceMax === 500000) {
        this.priceMin = 0;
        this.priceMax = 500000;
        this.priceRange = [this.priceMin, this.priceMax];
    }
  }



  // --- FILTERS LOGIC ---

  applyFilters() {
    const subUnion = Object.values(this.selectedSubcategoriesMap).flat();
    const hasAnyCategory = this.selectedCategories.length > 0;
    const hasAnySub = subUnion.length > 0;
    const hasAnySize = this.selectedSizes.length > 0;

    const filtered = this.originalProducts.filter(p => {
      const productCategory = ProductUtils.normalize(
        typeof (p as any).category === 'string' ? (p as any).category : ((p as any).category?.name ?? '')
      );
      const productSubcategory = ProductUtils.normalize(
        typeof (p as any).subcategory === 'string' ? (p as any).subcategory : ((p as any).subcategory?.name ?? '')
      );

      let include = !(hasAnyCategory || hasAnySub);

      if (hasAnyCategory) {
        if (this.selectedCategories.includes(productCategory)) {
          const subsForCat = this.selectedSubcategoriesMap[productCategory];
          if (subsForCat && subsForCat.length > 0) {
            include = subsForCat.includes(productSubcategory);
          } else {
            include = true;
          }
        }
      }

      if (!include && hasAnySub) {
        include = subUnion.includes(productSubcategory);
      }

      const sizeMatch = !hasAnySize || this.selectedSizes.some(s => this.productHasSize(p, s));
      const price = this.getProductPrice(p);
      const priceMatch = price >= this.priceMin && price <= this.priceMax;
      return include && sizeMatch && priceMatch;
    });

    this.products = filtered;
    this.sortProducts();
    this.noResults = this.products.length === 0;
    this.generateFilterDescription();
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
             // If we want to restore original order, we re-apply filters on originalProducts
             // This is handled by applyFilters calling sortProducts, so we need to ensure applyFilters preserves order if 'relevance'
             // Actually applyFilters creates a new array from originalProducts which is already "relevance" sorted (by DB or search match)
             break;
      }
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

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (this.isMobileView && isPlatformBrowser(this.platformId)) {
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.overflow = this.showFilters ? 'hidden' : 'auto';
      }
    }
  }
  
  onOverlayClick(event: Event) {
      this.toggleFilters();
  }

  // --- Accordion ---
  onAccordionToggled(value: string) {
      if (this.openAccordions.has(value)) {
          this.openAccordions.delete(value);
      } else {
          this.openAccordions.add(value);
      }
  }

  togglePretAPorter() {
      this.pretAPorterOpen = !this.pretAPorterOpen;
  }

  toggleNovias() {
      this.noviasOpen = !this.noviasOpen;
  }

  toggleCategory(categoryValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const idx = this.selectedCategories.indexOf(cat);
    if (idx >= 0) {
      this.selectedCategories.splice(idx, 1);
      delete this.selectedSubcategoriesMap[cat];
    } else {
      this.selectedCategories.push(cat);
    }
    this.openAccordions.add('categorias');
  }

  isCategorySelected(categoryValue: string): boolean {
    const cat = ProductUtils.normalize(categoryValue);
    return this.selectedCategories.includes(cat);
  }

  toggleSubcategory(categoryValue: string, subValue: string): void {
      const cat = ProductUtils.normalize(categoryValue);
      const sub = ProductUtils.normalize(subValue);
      const arr = this.selectedSubcategoriesMap[cat] || [];
      const idx = arr.indexOf(sub);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(sub);
      }
      if (arr.length) {
        this.selectedSubcategoriesMap[cat] = arr;
      } else {
        delete this.selectedSubcategoriesMap[cat];
      }
  }

  isSubcategorySelected(categoryValue: string, subValue: string): boolean {
      const cat = ProductUtils.normalize(categoryValue);
      const sub = ProductUtils.normalize(subValue);
      const arr = this.selectedSubcategoriesMap[cat] || [];
      return arr.includes(sub);
  }

  toggleSize(size: string): void {
      const s = String(size).toUpperCase();
      if (!this.allowedSizes.includes(s)) return;
      const idx = this.selectedSizes.indexOf(s);
      if (idx >= 0) {
        this.selectedSizes.splice(idx, 1);
      } else {
        this.selectedSizes.push(s);
      }
  }

  isSizeSelected(size: string): boolean {
      return this.selectedSizes.includes(String(size).toUpperCase());
  }

  onPriceRangeChange(range: number[]): void {
      if (!Array.isArray(range)) return;
      const min = Math.max(0, Math.min(500000, Number(range[0] ?? 0)));
      const max = Math.max(0, Math.min(500000, Number(range[1] ?? 500000)));
      this.priceMin = Math.min(min, max);
      this.priceMax = Math.max(min, max);
      this.priceRange = [this.priceMin, this.priceMax];
  }

  onPriceInputChange(which: 'min' | 'max', value: number): void {
      const num = Math.max(0, Math.min(500000, Number(value ?? 0)));
      if (which === 'min') {
        this.priceMin = Math.min(num, this.priceMax);
      } else {
        this.priceMax = Math.max(num, this.priceMin);
      }
      this.priceRange = [this.priceMin, this.priceMax];
  }

  applyFiltersAction(isMobile: boolean) {
       if (this.loading) {
           return;
       }
      let term = (this.searchTerm || '').trim();
      
      // Always clear search input when applying filters from filter panel
      if (this.hasActiveFilters()) {
          this.searchTerm = '';
          term = '';
          this.searchMode = 'filters';
      }
      
      const mode: 'input' | 'filters' | null = this.hasActiveFilters() ? 'filters' : 'input';
      const signature = this.buildSearchSignature(term, mode);
      if (this.lastSearchSignature === signature && this.hasSearched) {
          return;
      }
      if (term.length > 0) {
          this.saveRecentSearch(term);
      }
      if (term.length > 0 || this.hasActiveFilters()) {
          this.hasSearched = true;
          if (!this.hasActiveFilters()) this.searchMode = 'input';
          this.lastSearchSignature = signature;
          this.updateUrl();
          this.fetchProducts();
      } else {
          // Show spinner for empty search, then reset to default state
          this.loading = true;
          setTimeout(() => {
              this.hasSearched = false;
              this.searchMode = 'input';
              this.products = [];
              this.originalProducts = [];
              this.noResults = false;
              this.loading = false;
              this.updateUrl();
              this.lastSearchSignature = null;
          }, 1000); // Show spinner for 1 second
      }
      if (isMobile) {
          this.toggleFilters();
      }
  }

  clearFilters() {
      // Show loading spinner and maintain search state for spinner display
      this.loading = true;
      this.hasSearched = true; // Keep true to show spinner during reset
      
      // Clear all filters
      this.selectedCategories = [];
      this.selectedSubcategoriesMap = {};
      this.selectedSizes = [];
      this.priceMin = 0;
      this.priceMax = 500000;
      this.priceRange = [0, 500000];
      this.searchTerm = '';
      
      // Hide filters panel on mobile
      this.showFilters = false;
      if (this.isMobileView && isPlatformBrowser(this.platformId)) {
          if (typeof document !== 'undefined' && document.body) {
              document.body.style.overflow = 'auto';
          }
      }
      
      // Update URL immediately
      this.updateUrl();
      
      // Simulate loading and then show search history
      setTimeout(() => {
          this.products = [];
          this.originalProducts = [];
          this.noResults = false;
          this.loading = false;
          this.hasSearched = false; // Reset to false to show recent searches after loading

          this.lastSearchSignature = null;
          
          // Focus on search input
          setTimeout(() => {
              if (this.inputElement?.nativeElement) {
                  this.inputElement.nativeElement.focus();
              }
          }, 0);
      }, 1000); // Show spinner for 1 second
  }

  private loadRecentSearches(): void {
      if (!isPlatformBrowser(this.platformId)) return;
      try {
          const raw = localStorage.getItem(this.RECENT_KEY);
          const arr = raw ? JSON.parse(raw) : [];
          if (Array.isArray(arr)) {
              this.recentSearches = arr.filter((x: any) => typeof x === 'string').slice(0, 5);
          }
      } catch {}
  }

  private saveRecentSearch(term: string): void {
      if (!isPlatformBrowser(this.platformId)) return;
      const t = String(term).trim();
      if (!t) return;
      const existing = this.recentSearches.filter(s => s.toLowerCase() !== t.toLowerCase());
      this.recentSearches = [t, ...existing].slice(0, 5);
      try {
          localStorage.setItem(this.RECENT_KEY, JSON.stringify(this.recentSearches));
      } catch {}
  }

  onRecentClick(term: string): void {
      this.searchTerm = term;
      this.applyFiltersAction(false);
  }

  private buildSearchSignature(term: string, mode: 'input' | 'filters' | null): string {
      const normTerm = (term || '').trim().toLowerCase();
      const cats = [...this.selectedCategories].map(c => ProductUtils.normalize(c)).sort();
      const subs = this.getSelectedSubcategoriesFlat()
        .map(s => `${ProductUtils.normalize(s.category)}|${ProductUtils.normalize(s.subcategory)}`)
        .sort();
      const sizes = [...this.selectedSizes].map(s => String(s).toUpperCase()).sort();
      return JSON.stringify({
          mode,
          term: mode === 'filters' ? '' : normTerm,
          cats,
          subs,
          sizes,
          priceMin: this.priceMin,
          priceMax: this.priceMax
      });
  }

  getSelectedSubcategoriesFlat(): { category: string; subcategory: string }[] {
      const out: { category: string; subcategory: string }[] = [];
      this.selectedCategories.forEach(cat => {
        const subs = this.selectedSubcategoriesMap[cat] || [];
        subs.forEach(sub => out.push({ category: cat, subcategory: sub }));
      });
      return out;
  }

  getSubcategoriesForCategory(categoryValue: string): { label: string; value: string }[] {
      const catNorm = ProductUtils.normalize(categoryValue);
      
      // Check in generic categories
      const catObj = this.categories.find(c => ProductUtils.normalize(c.value) === catNorm);
      if (catObj?.subsections) {
        return catObj.subsections;
      }
      
      // Check in Pret a Porter
      const pretAPorterObj = this.pretAPorterCategories.find(c => ProductUtils.normalize(c.value) === catNorm);
      if (pretAPorterObj?.subsections) {
        return pretAPorterObj.subsections;
      }
      
      // Check in Novias
      const noviasObj = this.noviasCategories.find(c => ProductUtils.normalize(c.value) === catNorm);
      if (noviasObj?.subsections) {
        return noviasObj.subsections;
      }
      
      return [];
  }

  // --- Category/Subcategory Toggles ---
  // (Methods are already defined above: togglePretAPorterCategory, toggleNoviasCategory, etc.)
  
  // Helper for generic categories (if used) or fallback
  // getSubcategoriesForCategory is defined above (line 807)

  // --- Sizes (Duplicate removed) ---
  // toggleSize defined above
  // isSizeSelected defined above

  // --- Price (Duplicate removed) ---
  // onPriceRangeChange defined above
  // onPriceInputChange defined above

  // --- Actions (Duplicate removed) ---
  // clearFilters defined above
  // applyFiltersAction defined above

  hasActiveFilters(): boolean {
      return this.selectedCategories.length > 0 || 
             this.selectedSizes.length > 0 || 
             Object.keys(this.selectedSubcategoriesMap).length > 0 ||
             this.priceMin > 0 || 
             this.priceMax < this.maxPriceLimit;
  }

  generateFilterDescription(): void {
    const parts: string[] = [];
    
    // Add categories
    this.selectedCategories.forEach(cat => {
      const subcategories = this.selectedSubcategoriesMap[cat] || [];
      if (subcategories.length > 0) {
        parts.push(...subcategories.map(sub => this.getCategoryDisplayName(sub)));
      } else {
        parts.push(this.getCategoryDisplayName(cat));
      }
    });
    
    // Add sizes
    if (this.selectedSizes.length > 0) {
      parts.push(...this.selectedSizes);
    }
    
    // Generate description
    if (parts.length === 0) {
      this.filterDescription = '';
    } else if (parts.length <= 3) {
      this.filterDescription = parts.join(', ');
    } else {
      this.filterDescription = parts.slice(0, 3).join(', ') + '...';
    }
  }

  private getCategoryDisplayName(categoryValue: string): string {
    // Find in any of the category lists
    const allCategories = [...this.categories, ...this.pretAPorterCategories, ...this.noviasCategories];
    const found = allCategories.find(cat => ProductUtils.normalize(cat.value) === ProductUtils.normalize(categoryValue));
    return found ? found.label : categoryValue;
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
  
  private getProductSizes(p: Product): string[] {
      const sizes = new Set<string>();
      const anyP: any = p as any;
      
      // Direct size
      if (anyP.size) sizes.add(String(anyP.size).toUpperCase());
      if (Array.isArray(anyP.sizes)) anyP.sizes.forEach((s: any) => sizes.add(String(s).toUpperCase()));
      
      // Variants
      if (Array.isArray(anyP.variants)) {
          anyP.variants.forEach((v: any) => {
              const vSize = [v?.size, v?.size_name, v?.talla, v?.tamano, v?.tamanos]
                  .flat()
                  .filter(Boolean)
                  .map((x: any) => String(x).toUpperCase());
              vSize.forEach((s: string) => sizes.add(s));
          });
      }
      return Array.from(sizes);
  }

  private productHasSize(p: Product, size: string): boolean {
    const sUp = String(size).toUpperCase();
    const anyP: any = p as any;
    if (typeof anyP.size === 'string' && String(anyP.size).toUpperCase() === sUp) return true;
    if (Array.isArray(anyP.sizes) && anyP.sizes.map((x: any) => String(x).toUpperCase()).includes(sUp)) return true;
    if (Array.isArray(anyP.variants)) {
      return anyP.variants.some((v: any) => {
        const vSize = [v?.size, v?.size_name, v?.talla, v?.tamano, v?.tamanos]
          .flat()
          .filter(Boolean)
          .map((x: any) => String(x).toUpperCase());
        return vSize.includes(sUp);
      });
    }
    return false;
  }

  trackByProductId(index: number, product: Product): string {
    return product.id || product.slug;
  }

  onColorSelected(event: { productId: string; color: string }): void {
    this.selectedColors[event.productId] = event.color;
    // Logic to update image in local product object if needed
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
      // Optionally save to service/localstorage
    }
  }
}
