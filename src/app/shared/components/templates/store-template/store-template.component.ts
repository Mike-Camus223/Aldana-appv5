import { Component, OnInit, HostListener, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

import { combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { Product, Collection } from '../../../utils/models/Products-supabase.interface';
import { ProductUtils } from '../../../utils/dataEx/products-utils';
import { CardproductComponent } from '../../generic/cardproduct/cardproduct.component';
import { Funnel, LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-angular';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { LoadingbarComponent } from '../../system/loadingbar/loadingbar.component';
import { AldyCheckboxV1Directive } from '../../../utils/directives/aldy-checkbox-v1.directive';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ProductsService } from '../../../../core/services/data-access/products/products.service';
import { PaginatorComponent } from '../../generic/paginator/paginator.component';


@Component({
  selector: 'app-store-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardproductComponent,
    LucideAngularModule,
    AcordiongenericComponent,
    LoadingbarComponent,
    AldyCheckboxV1Directive,
    PaginatorComponent
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
      useValue: new LucideIconProvider({ Funnel, ChevronDown, ChevronUp, Minus, Plus })
    }
  ],
})
export class StoreTemplateComponent implements OnInit {

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
  itemsPerPage: number = 16;

  // Flag to toggle color-specific variant images on cards
  enableColorImageChange = false;

  // Stored state from the initial entry route
  private entryRouteState: {
    categoria: string | null;
    subcategoria: string | null;
    scope: string | null;
    qpCats: string | null;
    qpSubs: string | null;
    qpColl: string | null;
    qpBridesColl: string | null;
  } | null = null;
  readonly maxPages: number = 16;
  currentPage: number = 1;
  pagedProducts: Product[] = [];
  pagesArray: number[] = [];
  private renderVersion: number = 0;
  private isApplyingFilters = false;
  private applyFiltersPromise: Promise<void> | null = null;
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
  pretAPorterOpen = false;
  noviasOpen = false;

  // Collections state
  allCollections: any[] = [];
  allBridesCollections: any[] = [];
  topCollections: any[] = [];
  topBridesCollections: any[] = [];

  // Track open state for collection dropdowns
  openCollectionDropdowns: Set<string> = new Set();
  selectedCollectionId: string | 'general' | null = null;
  selectedBridesCollectionId: string | 'general' | null = null;
  activeCategoryScope: string | null = null;

  private categoriesCache = new Map<string, any[]>();
  private subcategoriesCache = new Map<string, any[]>();

  @ViewChild('productsContainer') productsContainerRef?: ElementRef<HTMLDivElement>;
  private containerLocked = false;
  private lockedHeight = 0;
  private currentFavorites: Set<string> = new Set();

  categories: any[] = [];
  pretAPorterCategories: any[] = [];
  noviasCategories: any[] = [];
  get isBridalView(): boolean {
    return !!this.selectedBridesCollectionId || (this.activeCategoryScope?.startsWith('bridal') ?? false);
  }

  constructor(
    private productsService: ProductsService,
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
    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(async ([params, qp]) => {
      this.loading = true;
      this.filteredProducts = [];
      const categoriaParam = params.get('categoria');
      const subcategoriaParam = params.get('subcategoria');
      const scopeParam = params.get('scope');

      try {
        // Cargar categorías dinámicas primero
        await this.loadDynamicFilters();

        if (this.allProducts.length === 0) {
          // Cargar colecciones normales
          const collectionsData = await this.productsService.getAllCollections();
          this.allCollections = collectionsData || [];
          this.topCollections = [...this.allCollections]
            .sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime())
            .slice(0, 4);

          // Cargar colecciones bridal
          const bridesCollectionsData = await this.bridesProductsService.getCollections();
          this.allBridesCollections = bridesCollectionsData?.data || [];
          this.topBridesCollections = [...this.allBridesCollections]
            .sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime())
            .slice(0, 4);

          const { data, error } = await this.productsService.getProducts();
          if (error) {
            console.error('Error loading products:', error);
            this.loading = false;
            return;
          }

          if (Array.isArray(data)) {
            this.allProducts = ProductUtils.mapProducts(data, false);
            this.allProducts.forEach(p => {
              this.selectedColors[p.id] = p.variants[0]?.color_name || '';
            });

            // Cargar productos bridal también por defecto
            await this.loadBridesProducts();

            // Sincronizar con favoritos actuales si está autenticado
            if (this.authService.isAuthenticated()) {
              this.updateWishlistStatus(this.currentFavorites);
            }
          }
        }
        // Reset all filter state to default before parsing route parameters
        this.selectedCategories = [];
        this.selectedSubcategoriesMap = {};
        this.selectedCollectionId = null;
        this.selectedBridesCollectionId = null;
        this.selectedSizes = [];
        this.priceMin = 0;
        this.priceMax = 500000;
        this.priceRange = [0, 500000];
        this.currentPage = 1;
        this.activeCategoryScope = null;

        if (categoriaParam) {
          this.selectedCategories = [ProductUtils.normalize(categoriaParam)];
        }

        // Leer query params híbridos
        const qpCats = qp.get('categorias');
        const qpSubs = qp.get('subcategorias');
        const qpColl = qp.get('coleccion');
        const qpBridesColl = qp.get('coleccion_novias');

        if (qpColl) {
          this.selectedCollectionId = qpColl;
        }
        if (qpBridesColl) {
          this.selectedBridesCollectionId = qpBridesColl;
        }
        if (scopeParam === 'general') {
          this.selectedCollectionId = 'general';
          this.selectedBridesCollectionId = null;
        } else if (scopeParam === 'general-novias') {
          this.selectedBridesCollectionId = 'general';
          this.selectedCollectionId = null;
        }
        if (this.selectedBridesCollectionId) {
          this.activeCategoryScope = this.buildScopeKey('bridal', this.selectedBridesCollectionId);
        } else if (this.selectedCollectionId) {
          this.activeCategoryScope = this.buildScopeKey('normal', this.selectedCollectionId);
        } else {
          this.activeCategoryScope = null;
        }

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

        // Guardar el estado de entrada inicial si es la primera vez que se carga
        if (!this.entryRouteState) {
          this.entryRouteState = {
            categoria: categoriaParam,
            subcategoria: subcategoriaParam,
            scope: scopeParam,
            qpCats: qp.get('categorias'),
            qpSubs: qp.get('subcategorias'),
            qpColl: qp.get('coleccion'),
            qpBridesColl: qp.get('coleccion_novias')
          };
        }

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
    if (this.enableColorImageChange) {
      const selectedVariant = product.variants.find(v => v.color_name === color);
      if (selectedVariant) {
        product.main_image = selectedVariant.main_image ?? '';
        product.media = selectedVariant.media ?? [];
      }
    }
  }

  // --- LÓGICA DE COLECCIONES ---
  toggleCollectionDropdown(id: string): void {
    if (this.openCollectionDropdowns.has(id)) {
      this.openCollectionDropdowns.delete(id);
    } else {
      this.openCollectionDropdowns.add(id);
      // Si es una colección de novias, asegurar que los productos estén cargados
      if (id.startsWith('bridal-')) {
        this.loadBridesProducts().then(() => {
          this.clearCaches();
        });
      }
    }
  }

  isCollectionDropdownOpen(id: string): boolean {
    return this.openCollectionDropdowns.has(id);
  }

  selectCollection(type: 'normal' | 'bridal', id: string | 'general' | null): void {
    if (type === 'normal') {
      this.selectedCollectionId = this.selectedCollectionId === id ? null : id;
      this.selectedBridesCollectionId = null; // Reset bridal selection if normal selected
    } else {
      this.selectedBridesCollectionId = this.selectedBridesCollectionId === id ? null : id;
      this.selectedCollectionId = null; // Reset normal selection if bridal selected
    }
    this.activeCategoryScope = `${type}-${String(id ?? 'none')}`;
    // Reset categories/subcategories when collection changes
    this.selectedCategories = [];
    this.selectedSubcategoriesMap = {};
    this.clearCaches();
    this.applyFilters();
  }

  private clearCaches(): void {
    this.categoriesCache.clear();
    this.subcategoriesCache.clear();
  }

  private isBridalProduct(p: Product): boolean {
    if (p.isBridal) return true;
    const source = (p as any)?.source_module;
    if (source === 'bridal') return true;
    const catName = ProductUtils.normalize(typeof p.category === 'string' ? p.category : (p.category?.name ?? ''));
    return catName === 'vestidos de novia' || catName === 'velos';
  }

  getCategoriesForCollection(type: 'normal' | 'bridal', id: string | 'general' | null): { label: string, value: string }[] {
    const cacheKey = `${type}-${id}`;
    if (this.categoriesCache.has(cacheKey)) {
      return this.categoriesCache.get(cacheKey)!;
    }

    if (id === 'general') {
      // General debe mostrar solo productos SIN colección asignada.
      const categoryMap = new Map<string, string>();
      this.allProducts.forEach(p => {
        const isBridal = this.isBridalProduct(p);
        const hasCollection = Array.isArray(p?.collections) && p.collections.length > 0;

        if (type === 'normal') {
          if (isBridal || hasCollection) return;
        } else {
          if (!isBridal || hasCollection) return;
        }

        const catName = typeof p.category === 'string' ? p.category : p.category?.name;
        if (catName) {
          categoryMap.set(ProductUtils.normalize(catName), catName);
        }
      });

      const result = Array.from(categoryMap.entries()).map(([value, label]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value
      }));

      this.categoriesCache.set(cacheKey, result);
      return result;
    }

    const products = this.allProducts.filter(p => {
      const isBridal = this.isBridalProduct(p);
      if (type === 'normal' && isBridal) return false;
      if (type === 'bridal' && !isBridal) return false;
      return p.collections?.some(c => String(c.id) === String(id));
    });

    const categoryMap = new Map<string, string>();
    products.forEach(p => {
      const catName = typeof p.category === 'string' ? p.category : p.category?.name;
      if (catName) {
        categoryMap.set(ProductUtils.normalize(catName), catName);
      }
    });

    const result = Array.from(categoryMap.entries()).map(([value, label]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value
    }));

    this.categoriesCache.set(cacheKey, result);
    return result;
  }

  getSubcategoriesForCollectionCategory(type: 'normal' | 'bridal', id: string | 'general' | null, categoryValue: string): { label: string, value: string }[] {
    const cacheKey = `${type}-${id}-${categoryValue}`;
    if (this.subcategoriesCache.has(cacheKey)) {
      return this.subcategoriesCache.get(cacheKey)!;
    }

    const catNorm = ProductUtils.normalize(categoryValue);

    if (id === 'general') {
      // General debe mostrar solo subcategorías de productos SIN colección.
      const subcatMap = new Map<string, string>();
      this.allProducts.forEach(p => {
        const isBridal = this.isBridalProduct(p);
        const hasCollection = Array.isArray(p?.collections) && p.collections.length > 0;

        if (type === 'normal') {
          if (isBridal || hasCollection) return;
        } else {
          if (!isBridal || hasCollection) return;
        }

        const pCatNorm = ProductUtils.normalize(
          typeof p.category === 'string' ? p.category : p.category?.name || ''
        );
        if (pCatNorm !== catNorm) return;

        const subName = typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name;
        if (subName) {
          subcatMap.set(ProductUtils.normalize(subName), subName);
        }
      });

      const result = Array.from(subcatMap.entries()).map(([value, label]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value
      }));

      this.subcategoriesCache.set(cacheKey, result);
      return result;
    }

    const products = this.allProducts.filter(p => {
      const isBridal = this.isBridalProduct(p);
      if (type === 'normal' && isBridal) return false;
      if (type === 'bridal' && !isBridal) return false;

      const pCatNorm = ProductUtils.normalize(typeof p.category === 'string' ? p.category : p.category?.name || '');
      if (pCatNorm !== catNorm) return false;

      return p.collections?.some(c => String(c.id) === String(id));
    });

    const subcatMap = new Map<string, string>();
    products.forEach(p => {
      const subName = typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name;
      if (subName) {
        subcatMap.set(ProductUtils.normalize(subName), subName);
      }
    });

    const result = Array.from(subcatMap.entries()).map(([value, label]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value
    }));

    this.subcategoriesCache.set(cacheKey, result);
    return result;
  }

  // --- NUEVA LÓGICA DE SELECCIÓN ---
  private buildScopeKey(type: 'normal' | 'bridal', id: string | 'general' | null): string {
    return `${type}-${String(id ?? 'none')}`;
  }

  private setActiveScope(type: 'normal' | 'bridal', id: string | 'general' | null): void {
    const nextScope = this.buildScopeKey(type, id);
    if (this.activeCategoryScope && this.activeCategoryScope !== nextScope) {
      // Evita mezclar categorías homónimas entre General y Colecciones.
      this.selectedCategories = [];
      this.selectedSubcategoriesMap = {};
    }
    this.activeCategoryScope = nextScope;

    if (type === 'normal') {
      this.selectedCollectionId = id;
      this.selectedBridesCollectionId = null;
    } else {
      this.selectedBridesCollectionId = id;
      this.selectedCollectionId = null;
    }
  }

  toggleCategoryInScope(type: 'normal' | 'bridal', id: string | 'general' | null, categoryValue: string): void {
    this.setActiveScope(type, id);
    this.toggleCategory(categoryValue);
  }

  isCategorySelectedInScope(type: 'normal' | 'bridal', id: string | 'general' | null, categoryValue: string): boolean {
    const scope = this.buildScopeKey(type, id);
    if (this.activeCategoryScope !== scope) return false;
    return this.isCategorySelected(categoryValue);
  }

  toggleCategory(categoryValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const idx = this.selectedCategories.indexOf(cat);
    if (idx >= 0) {
      this.selectedCategories.splice(idx, 1);
      delete this.selectedSubcategoriesMap[cat];
    } else {
      this.selectedCategories.push(cat);
      // Abrir el acordeón de subcategorías automáticamente al seleccionar una categoría
      this.openAccordions.add('subcategorias');
    }
    // Mantener Categorías abierto
    this.openAccordions.add('categorias');
  }

  isCategorySelected(categoryValue: string): boolean {
    const cat = ProductUtils.normalize(categoryValue);
    return this.selectedCategories.includes(cat);
  }

  getSubcategoriesForCategory(categoryValue: string): { label: string; value: string }[] {
    const catNorm = ProductUtils.normalize(categoryValue);

    // Si hay una colección seleccionada, filtrar subcategorías por esa colección
    if (this.selectedCollectionId) {
      return this.getSubcategoriesForCollectionCategory('normal', this.selectedCollectionId, categoryValue);
    }
    if (this.selectedBridesCollectionId) {
      return this.getSubcategoriesForCollectionCategory('bridal', this.selectedBridesCollectionId, categoryValue);
    }

    // Fallback a las categorías estáticas si no hay colección seleccionada (aunque ahora todo debería pasar por colecciones)
    const allStaticCats = [...this.categories, ...this.pretAPorterCategories, ...this.noviasCategories];
    const catObj = allStaticCats.find(c => ProductUtils.normalize(c.value) === catNorm);
    return catObj?.subsections || [];
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
    if (p.isBridal) return false;
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
    if (this.selectedCategories.length > 0) {
      this.applyFiltersAction();
    }
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
    this.applyFiltersAction();
  }

  clearFilters(): void {
    if (this.entryRouteState) {
      this.selectedCategories = [];
      if (this.entryRouteState.categoria) {
        this.selectedCategories.push(ProductUtils.normalize(this.entryRouteState.categoria));
      }
      if (this.entryRouteState.qpCats) {
        const extraCats = this.entryRouteState.qpCats.split(',').map(c => ProductUtils.normalize(c)).filter(Boolean);
        this.selectedCategories = Array.from(new Set([...this.selectedCategories, ...extraCats]));
      }

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

      if (this.entryRouteState.qpSubs) {
        this.entryRouteState.qpSubs.split(',').map(s => ProductUtils.normalize(s)).filter(Boolean).forEach(addSubToMap);
      }
      if (this.entryRouteState.subcategoria) {
        const subNorm = ProductUtils.normalize(this.entryRouteState.subcategoria);
        addSubToMap(subNorm);
      }

      this.selectedCollectionId = this.entryRouteState.qpColl || null;
      this.selectedBridesCollectionId = this.entryRouteState.qpBridesColl || null;

      if (this.entryRouteState.scope === 'general') {
        this.selectedCollectionId = 'general';
        this.selectedBridesCollectionId = null;
      } else if (this.entryRouteState.scope === 'general-novias') {
        this.selectedBridesCollectionId = 'general';
        this.selectedCollectionId = null;
      }

      if (this.selectedBridesCollectionId) {
        this.activeCategoryScope = this.buildScopeKey('bridal', this.selectedBridesCollectionId);
      } else if (this.selectedCollectionId) {
        this.activeCategoryScope = this.buildScopeKey('normal', this.selectedCollectionId);
      } else {
        this.activeCategoryScope = null;
      }
    } else {
      this.selectedCategories = [];
      this.selectedSubcategoriesMap = {};
      this.selectedCollectionId = null;
      this.selectedBridesCollectionId = null;
      this.activeCategoryScope = null;
    }

    this.selectedSizes = [];
    this.priceMin = 0;
    this.priceMax = 500000;
    this.priceRange = [0, 500000];
    this.currentPage = 1;
    this.openAccordions.clear();
    this.openAccordions.add('categorias');
    this.openCollectionDropdowns.clear();
    this.clearCaches(); // Limpiar cachés

    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    void this.applyFilters().then(() => {
      const url = this.buildUrlString();
      const [base, query] = url.split('?');
      this.location.replaceState(base, query ?? '');
      if (this.isMobileView) {
        this.toggleFilters();
      }
    });
  }

  hasFiltersApplied(): boolean {
    if (this.selectedSizes.length > 0) return true;
    if (this.priceRange[0] !== 0) return true;
    if (this.priceRange[1] !== 500000) return true;
    if (this.currentPage > 1) return true;
    if (!this.entryRouteState) return false;

    // Comparar categorías
    let baseCats: string[] = [];
    if (this.entryRouteState.categoria) {
      baseCats.push(ProductUtils.normalize(this.entryRouteState.categoria));
    }
    if (this.entryRouteState.qpCats) {
      baseCats.push(...this.entryRouteState.qpCats.split(',').map(c => ProductUtils.normalize(c)).filter(Boolean));
    }
    baseCats = Array.from(new Set(baseCats));

    if (this.selectedCategories.length !== baseCats.length) return true;
    const allBaseMatch = this.selectedCategories.every(c => baseCats.includes(c));
    if (!allBaseMatch) return true;

    // Comparar subcategorías
    let baseSubs: string[] = [];
    if (this.entryRouteState.subcategoria) {
      baseSubs.push(ProductUtils.normalize(this.entryRouteState.subcategoria));
    }
    if (this.entryRouteState.qpSubs) {
      baseSubs.push(...this.entryRouteState.qpSubs.split(',').map(s => ProductUtils.normalize(s)).filter(Boolean));
    }
    baseSubs = Array.from(new Set(baseSubs));

    const currentSubs = Object.values(this.selectedSubcategoriesMap).flat();
    if (currentSubs.length !== baseSubs.length) return true;
    const allBaseSubsMatch = currentSubs.every(s => baseSubs.includes(s));
    if (!allBaseSubsMatch) return true;

    // Comparar colecciones
    const expectedColl = this.entryRouteState.qpColl || null;
    const expectedBridesColl = this.entryRouteState.qpBridesColl || null;
    if (this.selectedCollectionId !== expectedColl) return true;
    if (this.selectedBridesCollectionId !== expectedBridesColl) return true;

    return false;
  }

  applyFiltersAction(isMobile: boolean = false): void {
    if (this.loading || this.isApplyingFilters || this.applyFiltersPromise) {
      return;
    }
    this.isApplyingFilters = true;
    this.applyFiltersPromise = this.applyFilters().then(() => {
      const url = this.buildUrlString();
      const [base, query] = url.split('?');
      this.location.replaceState(base, query ?? '');
      if (isMobile) {
        this.toggleFilters();
      }
    }).finally(() => {
      this.isApplyingFilters = false;
      this.applyFiltersPromise = null;
    });
  }

  private buildUrlString(): string {
    const subUnion = Object.values(this.selectedSubcategoriesMap).flat();
    const hasCollectionContext = !!(this.selectedCollectionId || this.selectedBridesCollectionId);
    const generalScope = this.selectedCollectionId === 'general'
      ? 'general'
      : this.selectedBridesCollectionId === 'general'
        ? 'general-novias'
        : null;
    const hasGeneralScope = !!generalScope;

    // SEO-friendly rutas híbridas: preferir path params cuando hay selección única
    let path: string[] = ['/tienda'];
    if (hasGeneralScope) {
      if (this.selectedCategories.length === 1 && subUnion.length === 1) {
        path = ['/tienda', 'categoria', generalScope as string, this.selectedCategories[0], 'subcategoria', subUnion[0]];
      } else if (this.selectedCategories.length === 1) {
        path = ['/tienda', 'categoria', generalScope as string, this.selectedCategories[0]];
      } else {
        path = ['/tienda'];
      }
    } else if (hasCollectionContext) {
      path = ['/tienda'];
    } else if (this.selectedCategories.length === 1 && subUnion.length === 1) {
      path = ['/tienda', 'categoria', this.selectedCategories[0], 'subcategoria', subUnion[0]];
    } else if (this.selectedCategories.length === 1) {
      path = ['/tienda', 'categoria', this.selectedCategories[0]];
    } else if (this.selectedCategories.length === 0 && subUnion.length === 1) {
      path = ['/tienda', 'subcategoria', subUnion[0]];
    }

    const queryParams: Record<string, any> = {};
    if (hasCollectionContext && !hasGeneralScope && this.selectedCategories.length > 0) {
      queryParams['categorias'] = this.selectedCategories.join(',');
    } else if (hasGeneralScope && this.selectedCategories.length > 1) {
      queryParams['categorias'] = this.selectedCategories.join(',');
    } else if (this.selectedCategories.length > 1) {
      queryParams['categorias'] = this.selectedCategories.join(',');
    }

    if (
      (hasCollectionContext && !hasGeneralScope && subUnion.length > 0) ||
      subUnion.length > 1 ||
      (this.selectedCategories.length !== 1 && subUnion.length === 1)
    ) {
      queryParams['subcategorias'] = subUnion.join(',');
    }

    if (this.selectedSizes.length > 0) {
      queryParams['tamanos'] = this.selectedSizes.join(',');
    }

    if (this.selectedCollectionId && !(hasGeneralScope && this.selectedCollectionId === 'general')) {
      queryParams['coleccion'] = this.selectedCollectionId;
    }
    if (this.selectedBridesCollectionId && !(hasGeneralScope && this.selectedBridesCollectionId === 'general')) {
      queryParams['coleccion_novias'] = this.selectedBridesCollectionId;
    }

    if (this.priceRange[0] !== 0) {
      queryParams['precio_min'] = this.priceRange[0];
    }
    if (this.priceRange[1] !== 500000) {
      queryParams['precio_max'] = this.priceRange[1];
    }

    if (this.currentPage > 1) {
      queryParams['page'] = this.currentPage;
    }

    let base = path.join('/');
    if (!base.startsWith('/')) base = '/' + base;

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
  private async applyFiltersSync(): Promise<void> {
    // Bloquear altura para evitar salto de scroll durante recalculo
    this.lockProductsContainer();
    const selectedSubUnion = Object.values(this.selectedSubcategoriesMap).flat();
    const hasAnyCategory = this.selectedCategories.length > 0;
    const hasAnySub = selectedSubUnion.length > 0;
    const hasAnySize = this.selectedSizes.length > 0;

    // Detectar contexto bridal sin depender de nombres fijos de categoría.
    const hasBridesContext =
      !!this.selectedBridesCollectionId ||
      this.activeCategoryScope?.startsWith('bridal-') === true;

    // Si hay categorías de novias, cargar productos desde BridesProductsService
    if (hasBridesContext) {
      await this.loadBridesProducts();
    }

    this.filterProducts(hasAnyCategory, hasAnySub, hasAnySize, selectedSubUnion);

    this.updatePagination();
    // Desbloquear altura tras recalculo
    this.unlockProductsContainer();
  }

  private filterProducts(hasAnyCategory: boolean, hasAnySub: boolean, hasAnySize: boolean, selectedSubUnion: string[]): void {
    this.filteredProducts = this.allProducts.filter(p => {
      const isBridal = this.isBridalProduct(p);

      // Filtro de colección Normal
      if (this.selectedCollectionId) {
        if (isBridal) return false;
        if (this.selectedCollectionId === 'general') {
          if (p.collections && p.collections.length > 0) return false;
        } else {
          if (!p.collections?.some(c => String(c.id) === String(this.selectedCollectionId))) return false;
        }
      }

      // Filtro de colección Bridal
      if (this.selectedBridesCollectionId) {
        if (!isBridal) return false;
        if (this.selectedBridesCollectionId === 'general') {
          if (p.collections && p.collections.length > 0) return false;
        } else {
          if (!p.collections?.some(c => String(c.id) === String(this.selectedBridesCollectionId))) return false;
        }
      }

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
    // Si ya está marcado como cargado pero por alguna razón no hay productos bridal
    // (p.ej. intento anterior con datos incompletos), reintentar carga.
    if (this.bridesLoaded) {
      const hasAnyBridal = this.allProducts.some(p => this.isBridalProduct(p));
      if (hasAnyBridal) return;
    }
    if (this.bridesLoadPromise) {
      return this.bridesLoadPromise;
    }
    this.bridesLoadPromise = (async () => {
      try {
        const bridesRes: any = await this.bridesProductsService.getProducts();
        const bridesData: any[] | null = Array.isArray(bridesRes) ? bridesRes : (bridesRes?.data ?? null);
        if (!Array.isArray(bridesData) && bridesRes?.error) {
          console.error('BridesProductsService.getProducts error:', bridesRes.error);
        }

        if (Array.isArray(bridesData)) {
          const mappedBrides = ProductUtils.mapProducts(bridesData, true);
          const bridesProducts = mappedBrides.map(p => ({
            ...p,
            source_module: 'bridal'
          }));

          const existingIds = new Set(this.allProducts.map(p => p.id));
          const newBridesProducts = bridesProducts.filter(p => !existingIds.has(p.id));
          this.allProducts.push(...newBridesProducts);
          const unique = new Map<string, Product>();
          for (const p of this.allProducts) {
            unique.set(p.id, p);
          }
          this.allProducts = Array.from(unique.values());

          // Inicializar color seleccionado para nuevos productos (evita filtros de color inconsistentes)
          newBridesProducts.forEach(p => {
            if (!this.selectedColors[p.id]) {
              this.selectedColors[p.id] = p.variants?.[0]?.color_name || '';
            }
          });
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

  public async applyFilters(): Promise<void> {
    this.lockProductsContainer();
    this.loading = true;
    this.filteredProducts = [];
    this.pagedProducts = [];
    this.currentPage = 1;

    // Add an asynchronous delay to ensure the spinner is visible to the user
    await new Promise(resolve => setTimeout(resolve, 800));

    await this.applyFiltersSync();
    this.loading = false;
    this.unlockProductsContainer();
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
    this.renderVersion++;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
    const url = this.buildUrlString();
    const [base, query] = url.split('?');
    this.location.replaceState(base, query ?? '');
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
    return product.id;
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
    // Buscar en todas las categorías posibles (incluyendo las de colecciones)
    const allProductsCategories = this.getCategoriesForCollection('normal', null);
    const allBridesCategories = this.getCategoriesForCollection('bridal', null);
    const allCats = [...allProductsCategories, ...allBridesCategories];

    for (const cat of allCats) {
      const subs = this.getSubcategoriesForCategory(cat.value);
      if (subs.some(s => ProductUtils.normalize(s.value) === subNormalized)) {
        return cat.value;
      }
    }
    return null;
  }

  // Métodos para manejar los acordiones de Pret a Porter y Novias
  togglePretAPorter(): void {
    this.pretAPorterOpen = !this.pretAPorterOpen;
  }

  toggleNovias(): void {
    this.noviasOpen = !this.noviasOpen;
    if (this.noviasOpen) {
      this.loadBridesProducts().then(() => {
        this.clearCaches();
      });
    }
  }

  private async loadDynamicFilters(): Promise<void> {
    try {
      // 1. Obtener datos de Supabase (Pret a Porter)
      const [normalCatsRes, normalSubsRes] = await Promise.all([
        this.productsService.getCategories(),
        this.productsService.getSubcategories()
      ]);

      if (normalCatsRes.data && normalSubsRes.data) {
        this.pretAPorterCategories = this.mapCategoriesAndSubcategories(
          normalCatsRes.data,
          normalSubsRes.data
        );
        // Fallback categories if needed
        this.categories = [...this.pretAPorterCategories];
      }

      // 2. Obtener datos de BridesProductsService (Novias)
      const [bridesCatsRes, bridesSubsRes] = await Promise.all([
        this.bridesProductsService.getCategories(),
        this.bridesProductsService.getSubcategories()
      ]);

      if (bridesCatsRes.data && bridesSubsRes.data) {
        this.noviasCategories = this.mapCategoriesAndSubcategories(
          bridesCatsRes.data,
          bridesSubsRes.data
        );
      }
    } catch (error) {
      console.error('Error loading dynamic filters:', error);
    }
  }

  private mapCategoriesAndSubcategories(categories: any[], subcategories: any[]): any[] {
    return categories.map(cat => {
      const catSubs = subcategories
        .filter(sub => sub.category_id === cat.id)
        .map(sub => ({
          label: sub.name,
          value: ProductUtils.normalize(sub.name)
        }));

      return {
        label: cat.name,
        value: ProductUtils.normalize(cat.name),
        subsections: catSubs
      };
    });
  }
}
