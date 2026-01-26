import { Component, OnInit, OnDestroy, HostListener, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { Product } from '../../../utils/models/Products-supabase.interface';
import { ProductUtils } from '../../../utils/dataEx/products-utils';
import { CardproductComponent } from '../../generic/cardproduct/cardproduct.component';
import { Funnel, LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { LoadingbarComponent } from '../../system/loadingbar/loadingbar.component';
import { AldyCheckboxV1Directive } from '../../../utils/directives/aldy-checkbox-v1.directive';
import { Location } from '@angular/common';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';


@Component({
  selector: 'app-store-template',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxModule,
    SliderModule,
    FormsModule,
    RouterModule,
    CardproductComponent,
    LucideAngularModule,
    AcordiongenericComponent,
    LoadingbarComponent,
    AldyCheckboxV1Directive,
  ],
  templateUrl: './store-template.component.html',
  styleUrls: ['./store-template.component.css'],
  animations: [
    trigger('gridAnimation', [
      transition('* => *', [
        style({ transform: 'scale(0.98)', opacity: 0.8 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      state('true', style({ transform: 'translateX(0)' })),
      state('false', style({ transform: 'translateX(-100%)' })),
      transition('false => true', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition('true => false', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Funnel, ChevronDown, ChevronUp })
    }
  ],
})
export class StoreTemplateComponent implements OnInit, OnDestroy {

  products: Product[] = [];
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  selectedColors: Record<string, string> = {};
  selectedCategory: string | null = null; 
  selectedSubcategory: string | null = null; 
  selectedCategories: string[] = [];
  selectedSubcategoriesMap: Record<string, string[]> = {};
  private wishlistKey = 'wishlistProducts';
  loading = true;
  activeAccordion: number = 0;
  showFilters = false;
  productColumns: number = 4;
  itemsPerPage: number = 4;
  readonly maxPages: number = 16; 
  currentPage: number = 1;
  pagedProducts: Product[] = [];
  pagesArray: number[] = [];
  allowedSizes: string[] = ['S', 'M', 'L'];
  selectedSizes: string[] = [];
  priceRange: number[] = [0, 500000];
  priceMin: number = 0;
  priceMax: number = 500000;
  isMobileView = false;
  selectedAccordion: string | null = null;
  openAccordions: Set<string> = new Set(['categorias']);
  get openAccordionsArray(): string[] { return Array.from(this.openAccordions); }
  private bridesLoaded = false;
  private bridesLoadPromise: Promise<void> | null = null;

  // Control de acordiones para Pret a Porter y Novias
  pretAPorterOpen = false;
  noviasOpen = false;

  @ViewChild('productsTop') productsTopRef?: ElementRef<HTMLDivElement>;
  @ViewChild('productsControls') productsControlsRef?: ElementRef<HTMLDivElement>;
  @ViewChild('productsContainer') productsContainerRef?: ElementRef<HTMLDivElement>;
  private containerLocked = false;
  private lockedHeight = 0;
  private currentFavorites: Set<string> = new Set();

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

  // Nuevas categorías para Pret a Porter y Novias
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
    private supabaseService: SupabaseService,
    private bridesProductsService: BridesProductsService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.checkMobileView();
    this.initializeRoute();
    
    // Suscribirse a cambios en favoritos
    this.favoritesService.favorites$.subscribe(favorites => {
      if (this.authService.isAuthenticated()) {
        this.currentFavorites = new Set(favorites.map(f => f.product_id));
        this.updateWishlistStatus(this.currentFavorites);
      }
    });
  }

  private updateWishlistStatus(favoriteIds: Set<string>): void {
    const updateProduct = (p: Product) => {
      p.wishlisted = favoriteIds.has(p.id);
    };

    if (this.allProducts) this.allProducts.forEach(updateProduct);
    if (this.filteredProducts) this.filteredProducts.forEach(updateProduct);
  }

  ngOnDestroy(): void {
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

  private async initializeRoute(): Promise<void> {
    this.route.paramMap.subscribe(async params => {
      this.loading = true;
      this.filteredProducts = [];
      const categoriaParam = params.get('categoria');
      const subcategoriaParam = params.get('subcategoria');

      try {
        if (this.allProducts.length === 0) {
          const { data, error } = await this.supabaseService.getProducts();
          if (error) {
            console.error('Error loading products:', error);
            this.loading = false;
            return;
          }

          if (Array.isArray(data)) {
            this.allProducts = ProductUtils.mapProducts(data);
            this.allProducts.forEach(p => {
              this.selectedColors[p.id] = p.variants[0]?.color_name || '';
            });

            // Sincronizar con favoritos actuales si está autenticado
            if (this.authService.isAuthenticated()) {
              this.updateWishlistStatus(this.currentFavorites);
            }
          }
        }
        // Inicializar selección múltiple desde path y query params
        this.selectedCategories = [];
        if (categoriaParam) {
          this.selectedCategories = [ProductUtils.normalize(categoriaParam)];
        }

        // Leer query params híbridos
        const qp = this.route.snapshot.queryParamMap;
        const qpCats = qp.get('categorias');
        const qpSubs = qp.get('subcategorias');

        if (qpCats) {
          const extraCats = qpCats.split(',').map(c => ProductUtils.normalize(c)).filter(Boolean);
          this.selectedCategories = Array.from(new Set([...(this.selectedCategories || []), ...extraCats]));
        }

        // Resetear subcategorías seleccionadas
        this.selectedSubcategoriesMap = {};

        const addSubToMap = (subNorm: string) => {
          const parent = this.findParentCategoryForSub(subNorm);
          if (parent) {
            if (!this.selectedCategories.includes(parent)) {
              this.selectedCategories.push(parent);
            }
            const arr = this.selectedSubcategoriesMap[parent] || [];
            if (!arr.includes(subNorm)) {
              arr.push(subNorm);
            }
            this.selectedSubcategoriesMap[parent] = arr;
          }
        };

        if (qpSubs) {
          qpSubs.split(',').map(s => ProductUtils.normalize(s)).filter(Boolean).forEach(addSubToMap);
        }

        if (subcategoriaParam) {
          const subNorm = ProductUtils.normalize(subcategoriaParam);
          addSubToMap(subNorm);
        }

        // Tamaños desde query: tamanos=S,M,L
        const qpSizes = qp.get('tamanos');
        if (qpSizes) {
          this.selectedSizes = qpSizes.split(',')
            .map(s => String(s).toUpperCase())
            .filter(s => this.allowedSizes.includes(s));
        }

        // Precio desde query: precio_min, precio_max
        const qpMin = qp.get('precio_min');
        const qpMax = qp.get('precio_max');
        if (qpMin !== null || qpMax !== null) {
          const min = Math.max(0, Math.min(500000, Number(qpMin ?? this.priceRange[0])));
          const max = Math.max(0, Math.min(500000, Number(qpMax ?? this.priceRange[1])));
          this.priceMin = Math.min(min, max);
          this.priceMax = Math.max(min, max);
          this.priceRange = [this.priceMin, this.priceMax];
        }

        // Página desde query: page
        const qpPageRaw = qp.get('page');
        const qpPage = qpPageRaw ? Number(qpPageRaw) : NaN;
        if (!Number.isNaN(qpPage) && qpPage > 0) {
          this.currentPage = qpPage;
        }

        // Abrir acordeón acorde al estado
        // Abrir acordeones iniciales: Categorías siempre. Subcategorías NO automáticamente
        this.openAccordions.clear();
        this.openAccordions.add('categorias');

        // Aplicar con animación similar a filtrar
        await this.applyFilters();

      } catch (error) {
        console.error('Error in initializeRoute:', error);
        this.loading = false;
      }
    });
  }

  checkMobileView(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth < 1024;
    }
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


  selectColor(event: { productId: string, color: string }): void {
    const { productId, color } = event;
    const product = this.filteredProducts.find(p => p.id === productId);
    if (!product) return;
    if (this.selectedColors[productId] === color) return;

    this.selectedColors[productId] = color;
    const selectedVariant = product.variants.find(v => v.color_name === color);
    if (selectedVariant?.color_name && selectedVariant?.color_hex) {
      product.main_image = selectedVariant.main_image ?? '';
      product.additional_images = selectedVariant.additional_images ?? [];
    }
  }

  // --- NUEVA LÓGICA DE SELECCIÓN ---
  toggleCategory(categoryValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const idx = this.selectedCategories.indexOf(cat);
    if (idx >= 0) {
      this.selectedCategories.splice(idx, 1);
      delete this.selectedSubcategoriesMap[cat];
    } else {
      this.selectedCategories.push(cat);
    }
    // Mantener Categorías abierto. NO abrir Subcategorías automáticamente
    this.openAccordions.add('categorias');
  }

  isCategorySelected(categoryValue: string): boolean {
    const cat = ProductUtils.normalize(categoryValue);
    return this.selectedCategories.includes(cat);
  }

  getSubcategoriesForCategory(categoryValue: string): { label: string; value: string }[] {
    const catNorm = ProductUtils.normalize(categoryValue);
    
    // Buscar en categorías originales
    const catObj = this.categories.find(c => ProductUtils.normalize(c.value) === catNorm);
    if (catObj?.subsections) {
      return catObj.subsections;
    }
    
    // Buscar en Pret a Porter
    const pretAPorterObj = this.pretAPorterCategories.find(c => ProductUtils.normalize(c.value) === catNorm);
    if (pretAPorterObj?.subsections) {
      return pretAPorterObj.subsections;
    }
    
    // Buscar en Novias
    const noviasObj = this.noviasCategories.find(c => ProductUtils.normalize(c.value) === catNorm);
    if (noviasObj?.subsections) {
      return noviasObj.subsections;
    }
    
    return [];
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

  // --- Tamaños ---
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

  // --- Precio ---
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

  private productHasSize(p: Product, size: string): boolean {
    const sUp = String(size).toUpperCase();
    const anyP: any = p as any;
    // Producto: campo único o array
    if (typeof anyP.size === 'string' && String(anyP.size).toUpperCase() === sUp) return true;
    if (Array.isArray(anyP.sizes) && anyP.sizes.map((x: any) => String(x).toUpperCase()).includes(sUp)) return true;
    // Variantes: size, size_name, talla, tamanos
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

  getSelectedSubcategoriesFlat(): { category: string; subcategory: string }[] {
    const out: { category: string; subcategory: string }[] = [];
    this.selectedCategories.forEach(cat => {
      const subs = this.selectedSubcategoriesMap[cat] || [];
      subs.forEach(sub => out.push({ category: cat, subcategory: sub }));
    });
    return out;
  }

  removeCategory(categoryValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const idx = this.selectedCategories.indexOf(cat);
    if (idx >= 0) {
      this.selectedCategories.splice(idx, 1);
    }
    delete this.selectedSubcategoriesMap[cat];
  }

  removeSubcategory(categoryValue: string, subValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const sub = ProductUtils.normalize(subValue);
    const arr = this.selectedSubcategoriesMap[cat] || [];
    const idx = arr.indexOf(sub);
    if (idx >= 0) {
      arr.splice(idx, 1);
      if (arr.length) {
        this.selectedSubcategoriesMap[cat] = arr;
      } else {
        delete this.selectedSubcategoriesMap[cat];
      }
    }
  }

  clearFilters(): void {
    this.selectedCategories = [];
    this.selectedSubcategoriesMap = {};
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.selectedSizes = [];
    this.priceMin = 0;
    this.priceMax = 500000;
    this.priceRange = [0, 500000];
    this.currentPage = 1;
    this.openAccordions.clear();
    this.openAccordions.add('categorias');
    this.applyFiltersSync();
    // Mantener SPA sin recarga total; actualizar solo URL sin navegación
    this.location.replaceState('/tienda');
    this.scrollToProductsTop();
  }

  applyFiltersAction(isMobile: boolean = false): void {
    if (this.loading) {
      return;
    }
    this.applyFilters().then(() => {
      const url = this.buildUrlString();
      // Actualiza la URL sin disparar navegación ni loaders genéricos
      const [base, query] = url.split('?');
      this.location.replaceState(base, query ?? '');
      this.scrollToProductsTop();
      if (isMobile) {
        this.toggleFilters();
      }
    });
  }

  private buildPathAndQuery(): { path: string[]; queryParams: Record<string, any> } {
    const subUnion = Object.values(this.selectedSubcategoriesMap).flat();

    // SEO-friendly rutas híbridas: preferir path params cuando hay selección única
    let path: string[] = ['/tienda'];
    if (this.selectedCategories.length === 1 && subUnion.length === 1) {
      // /tienda/categoria/:categoria/subcategoria/:subcategoria
      path = ['/tienda', 'categoria', this.selectedCategories[0], 'subcategoria', subUnion[0]];
    } else if (this.selectedCategories.length === 1) {
      // /tienda/categoria/:categoria
      path = ['/tienda', 'categoria', this.selectedCategories[0]];
    } else if (this.selectedCategories.length === 0 && subUnion.length === 1) {
      // /tienda/subcategoria/:subcategoria
      path = ['/tienda', 'subcategoria', subUnion[0]];
    }

    const queryParams: Record<string, any> = {};
    if (this.selectedCategories.length > 1) {
      // múltiples categorías como query param legible
      queryParams['categorias'] = this.selectedCategories.join(',');
    }
    if (subUnion.length > 1 || (this.selectedCategories.length !== 1 && subUnion.length === 1)) {
      // múltiples subcategorías o única sin categoría única
      queryParams['subcategorias'] = subUnion.join(',');
    }
    // Tamaños como query param
    if (this.selectedSizes.length > 0) {
      queryParams['tamanos'] = this.selectedSizes.join(',');
    }
    // Precio como query param (evitar defaults para SEO limpio)
    if (this.priceRange[0] !== 0) {
      queryParams['precio_min'] = this.priceRange[0];
    }
    if (this.priceRange[1] !== 500000) {
      queryParams['precio_max'] = this.priceRange[1];
    }
    // Página del paginator solo si > 1
    if (this.currentPage > 1) {
      queryParams['page'] = this.currentPage;
    }
    return { path, queryParams };
  }

  private buildUrlString(): string {
    const { path, queryParams } = this.buildPathAndQuery();
    let base = path.join('/');
    if (!base.startsWith('/')) base = '/' + base;
    // Construir query string de manera robusta
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        params.set(k, String(v));
      }
    });
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  applyFiltersMobile(): void {
    this.applyFiltersAction(true);
  }

  // buildFilterRoute ya no se usa con la navegación híbrida

  onOverlayClick(event: MouseEvent): void {
    this.toggleFilters();
  }

  stopSidebarClick(event: MouseEvent): void {
    event.stopPropagation();
  }
  private applyFiltersSync(): void {
    // Bloquear altura para evitar salto de scroll durante recalculo
    this.lockProductsContainer();
    const selectedSubUnion = Object.values(this.selectedSubcategoriesMap).flat();
    const hasAnyCategory = this.selectedCategories.length > 0;
    const hasAnySub = selectedSubUnion.length > 0;
    const hasAnySize = this.selectedSizes.length > 0;

    // Verificar si hay categorías de novias seleccionadas
    const hasBridesCategories = this.selectedCategories.some(cat => 
      cat === 'vestidos de novia' || cat === 'velos'
    );

    // Si hay categorías de novias, cargar productos desde BridesProductsService
    if (hasBridesCategories) {
      this.loadBridesProducts().then(() => {
        this.filterProducts(hasAnyCategory, hasAnySub, hasAnySize, selectedSubUnion);
      });
    } else {
      this.filterProducts(hasAnyCategory, hasAnySub, hasAnySize, selectedSubUnion);
    }

    this.updatePagination();
    // Desbloquear altura tras recalculo
    this.unlockProductsContainer();
  }

  private filterProducts(hasAnyCategory: boolean, hasAnySub: boolean, hasAnySize: boolean, selectedSubUnion: string[]): void {
    this.filteredProducts = this.allProducts.filter(p => {
      const productCategory = ProductUtils.normalize(
        typeof p.category === 'string' ? p.category : (p.category?.name ?? '')
      );
      const productSubcategory = ProductUtils.normalize(
        typeof p.subcategory === 'string' ? p.subcategory : (p.subcategory?.name ?? '')
      );

      // Si no hay ningún filtro seleccionado, incluir todos
      let include = !(hasAnyCategory || hasAnySub);

      if (hasAnyCategory) {
        if (this.selectedCategories.includes(productCategory)) {
          const subsForCat = this.selectedSubcategoriesMap[productCategory];
          if (subsForCat && subsForCat.length > 0) {
            include = subsForCat.includes(productSubcategory);
          } else {
            // Categoría seleccionada sin subcategorías específicas: incluir todas
            include = true;
          }
        }
      }

      if (!include && hasAnySub) {
        // Permitir mezclar: incluir si la subcategoría está seleccionada a nivel global
        include = selectedSubUnion.includes(productSubcategory);
      }

      const sizeMatch = !hasAnySize || this.selectedSizes.some(s => this.productHasSize(p, s));
      const price = this.getProductPrice(p);
      const priceMatch = price >= this.priceRange[0] && price <= this.priceRange[1];
      const colorMatch = !this.selectedColors[p.id] || p.variants.some(v => v.color_name === this.selectedColors[p.id]);
      return include && sizeMatch && priceMatch && colorMatch;
    });
  }

  private async loadBridesProducts(): Promise<void> {
    if (this.bridesLoaded) {
      return;
    }
    if (this.bridesLoadPromise) {
      return this.bridesLoadPromise;
    }
    this.bridesLoadPromise = (async () => {
      try {
        const bridesData = await this.bridesProductsService.getProducts();
        if (bridesData && Array.isArray(bridesData)) {
          const bridesProducts = bridesData.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            details: product.details,
            price: product.price,
            category: { 
              id: product.categories?.[0]?.id || 0,
              name: this.getBridesCategoryName(product) 
            },
            subcategory: { 
              id: product.subcategories?.[0]?.id || 0,
              name: this.getBridesSubcategoryName(product) 
            },
            main_image: product.main_image,
            additional_images: product.additional_images,
            sizes: product.sizes,
            slug: product.slug,
            avid: product.avid,
            variants: product.product_variants || [],
            collection: product.collection
          }));
          const existingIds = new Set(this.allProducts.map(p => p.id));
          const newBridesProducts = bridesProducts.filter(p => !existingIds.has(p.id));
          this.allProducts.push(...newBridesProducts);
          const unique = new Map<string, Product>();
          for (const p of this.allProducts) {
            unique.set(p.id, p);
          }
          this.allProducts = Array.from(unique.values());
        }
      } catch (error) {
        console.error('Error loading brides products:', error);
      } finally {
        this.bridesLoaded = true;
        this.bridesLoadPromise = null;
      }
    })();
    return this.bridesLoadPromise;
  }

  private getBridesCategoryName(product: any): string {
    // Determinar categoría basada en el producto
    if (product.categories && product.categories.name) {
      return product.categories.name.toLowerCase().includes('velo') ? 'velos' : 'vestidos de novia';
    }
    // Lógica por defecto basada en el nombre del producto
    const name = product.name.toLowerCase();
    if (name.includes('velo')) return 'velos';
    return 'vestidos de novia';
  }

  private getBridesSubcategoryName(product: any): string {
    // Determinar subcategoría basada en el producto
    if (product.subcategories && product.subcategories.name) {
      return product.subcategories.name;
    }
    // Lógica por defecto
    const name = product.name.toLowerCase();
    if (name.includes('velo 1')) return 'velos 1';
    if (name.includes('velo 2')) return 'velos 2';
    if (name.includes('velo 3')) return 'velos 3';
    if (name.includes('vestido 1')) return 'vestidos de novia 1';
    if (name.includes('vestido 2')) return 'vestidos de novia 2';
    if (name.includes('vestido 3')) return 'vestidos de novia 3';
    return 'vestidos de novia 1'; // valor por defecto
  }

  public async applyFilters(): Promise<void> {
    this.lockProductsContainer();
    this.loading = true;
    this.filteredProducts = [];
    this.currentPage = 1;
    await this.delay(500);
    this.applyFiltersSync();
    this.loading = false;
    this.unlockProductsContainer();
  }

  private scrollToProductsTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const targetEl = this.productsControlsRef?.nativeElement
          || this.productsTopRef?.nativeElement
          || document.getElementById('productsTop');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (e) {
        // fallback: scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Helpers: Paginación ---
  get totalPages(): number {
    const total = Math.ceil((this.filteredProducts.length || 0) / this.itemsPerPage);
    return Math.min(this.maxPages, Math.max(1, total));
  }

  // --- Helpers: Porcentajes para slider custom ---
  get lowerPercent(): number {
    return Math.round((this.priceMin / 500000) * 100);
  }
  get upperPercent(): number {
    return Math.round((this.priceMax / 500000) * 100);
  }

  private updatePagination(): void {
    // clamp current page
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    // build pages array
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    // slice products
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedProducts = this.filteredProducts.slice(start, end);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
    const url = this.buildUrlString();
    const [base, query] = url.split('?');
    this.location.replaceState(base, query ?? '');
    this.scrollToProductsTop();
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  // --- Helpers: Lock altura contenedor para evitar salto de scroll ---
  private lockProductsContainer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.productsContainerRef?.nativeElement;
    if (!el) return;
    // Solo bloquear si no está ya bloqueado
    if (!this.containerLocked) {
      this.lockedHeight = el.offsetHeight;
      el.style.minHeight = this.lockedHeight ? `${this.lockedHeight}px` : el.style.minHeight;
      this.containerLocked = true;
    }
  }

  private unlockProductsContainer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = this.productsContainerRef?.nativeElement;
    if (!el) return;
    if (this.containerLocked) {
      el.style.minHeight = '300px';
      this.containerLocked = false;
      this.lockedHeight = 0;
    }
  }


  trackByProductId(index: number, product: Product): string {
    return product.slug || product.id;
  }

  public normalize(text: string): string {
    return ProductUtils.normalize(text);
  }

  onAccordionToggled(value: string): void {
    const normalized = ProductUtils.normalize(value);
    if (this.openAccordions.has(normalized)) {
      this.openAccordions.delete(normalized);
    } else {
      this.openAccordions.add(normalized);
    }
  }

  private findParentCategoryForSub(subNormalized: string): string | null {
    for (const cat of this.categories) {
      const catNorm = ProductUtils.normalize(cat.value);
      const match = cat.subsections?.some(s => ProductUtils.normalize(s.value) === subNormalized || ProductUtils.normalize(s.label) === subNormalized);
      if (match) return catNorm;
    }
    return null;
  }

  // Métodos para manejar los acordiones de Pret a Porter y Novias
  togglePretAPorter(): void {
    this.pretAPorterOpen = !this.pretAPorterOpen;
  }

  toggleNovias(): void {
    this.noviasOpen = !this.noviasOpen;
  }

  // Métodos para manejar selección de categorías de Pret a Porter
  togglePretAPorterCategory(categoryValue: string): void {
    const index = this.selectedCategories.indexOf(categoryValue);
    if (index === -1) {
      this.selectedCategories.push(categoryValue);
    } else {
      this.selectedCategories.splice(index, 1);
      // Limpiar subcategorías de esta categoría
      if (this.selectedSubcategoriesMap[categoryValue]) {
        delete this.selectedSubcategoriesMap[categoryValue];
      }
    }
  }

  togglePretAPorterSubcategory(categoryValue: string, subcategoryValue: string): void {
    if (!this.selectedSubcategoriesMap[categoryValue]) {
      this.selectedSubcategoriesMap[categoryValue] = [];
    }
    const index = this.selectedSubcategoriesMap[categoryValue].indexOf(subcategoryValue);
    if (index === -1) {
      this.selectedSubcategoriesMap[categoryValue].push(subcategoryValue);
    } else {
      this.selectedSubcategoriesMap[categoryValue].splice(index, 1);
      if (this.selectedSubcategoriesMap[categoryValue].length === 0) {
        delete this.selectedSubcategoriesMap[categoryValue];
      }
    }
  }

  // Métodos para manejar selección de categorías de Novias
  toggleNoviasCategory(categoryValue: string): void {
    const index = this.selectedCategories.indexOf(categoryValue);
    if (index === -1) {
      this.selectedCategories.push(categoryValue);
    } else {
      this.selectedCategories.splice(index, 1);
      // Limpiar subcategorías de esta categoría
      if (this.selectedSubcategoriesMap[categoryValue]) {
        delete this.selectedSubcategoriesMap[categoryValue];
      }
    }
  }

  toggleNoviasSubcategory(categoryValue: string, subcategoryValue: string): void {
    if (!this.selectedSubcategoriesMap[categoryValue]) {
      this.selectedSubcategoriesMap[categoryValue] = [];
    }
    const index = this.selectedSubcategoriesMap[categoryValue].indexOf(subcategoryValue);
    if (index === -1) {
      this.selectedSubcategoriesMap[categoryValue].push(subcategoryValue);
    } else {
      this.selectedSubcategoriesMap[categoryValue].splice(index, 1);
      if (this.selectedSubcategoriesMap[categoryValue].length === 0) {
        delete this.selectedSubcategoriesMap[categoryValue];
      }
    }
  }

  // Helpers para verificar selección
  isPretAPorterCategorySelected(categoryValue: string): boolean {
    return this.selectedCategories.includes(categoryValue);
  }

  isPretAPorterSubcategorySelected(categoryValue: string, subcategoryValue: string): boolean {
    return this.selectedSubcategoriesMap[categoryValue]?.includes(subcategoryValue) || false;
  }

  isNoviasCategorySelected(categoryValue: string): boolean {
    return this.selectedCategories.includes(categoryValue);
  }

  isNoviasSubcategorySelected(categoryValue: string, subcategoryValue: string): boolean {
    return this.selectedSubcategoriesMap[categoryValue]?.includes(subcategoryValue) || false;
  }
}
