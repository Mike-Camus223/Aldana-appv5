import { Component, OnInit, OnDestroy, HostListener, Inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { Product } from '../../../utils/models/Products-supabase.interface';
import { ProductUtils } from '../../../utils/dataEx/products-utils';
import { CardproductComponent } from '../../generic/cardproduct/cardproduct.component';
import { Funnel, LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { LoadingbarComponent } from '../../system/loadingbar/loadingbar.component';
import { AldyRadioDirective } from '../../../utils/directives/aldy-radio.directive';
import { AldyCheckboxV1Directive } from '../../../utils/directives/aldy-checkbox-v1.directive';
import { Location } from '@angular/common';


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
  // Estado nuevo para selección múltiple
  selectedCategory: string | null = null; // mantenido por compatibilidad, no usado para filtrar
  selectedSubcategory: string | null = null; // mantenido por compatibilidad, no usado para filtrar
  selectedCategories: string[] = [];
  selectedSubcategoriesMap: Record<string, string[]> = {};
  private wishlistKey = 'wishlistProducts';
  loading = true;
  activeAccordion: number = 0;
  showFilters = false;
  productColumns: number = 4;
  // Paginación
  itemsPerPage: number = 4;
  readonly maxPages: number = 16; // no cambiable
  currentPage: number = 1;
  pagedProducts: Product[] = [];
  pagesArray: number[] = [];
  isMobileView = false;
  selectedAccordion: string | null = null; // mantenido por compatibilidad, no usado para abrir
  openAccordions: Set<string> = new Set(['categorias']);
  get openAccordionsArray(): string[] { return Array.from(this.openAccordions); }

  @ViewChild('productsTop') productsTopRef?: ElementRef<HTMLDivElement>;
  @ViewChild('productsControls') productsControlsRef?: ElementRef<HTMLDivElement>;
  @ViewChild('productsContainer') productsContainerRef?: ElementRef<HTMLDivElement>;
  private containerLocked = false;
  private lockedHeight = 0;

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

  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.checkMobileView();
    this.initializeRoute();
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

  toggleWishlist(productId: string): void {
    const product = this.filteredProducts.find(p => p.id === productId);
    if (!product) return;
    product.wishlisted = !product.wishlisted;
    this.saveWishlistToStorage();
  }

  private saveWishlistToStorage(): void {
    try {
      const wishlistedIds = this.filteredProducts.filter(p => p.wishlisted).map(p => p.id);
      if (typeof Storage !== 'undefined') {
        localStorage.setItem(this.wishlistKey, JSON.stringify(wishlistedIds));
      }
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  private loadWishlistFromStorage(): void {
    try {
      if (typeof Storage !== 'undefined') {
        const stored = localStorage.getItem(this.wishlistKey);
        if (stored) {
          const wishlistedIds: string[] = JSON.parse(stored);
          this.filteredProducts.forEach(p => (p.wishlisted = wishlistedIds.includes(p.id)));
        }
      }
    } catch (error) {
      console.warn('Could not load from localStorage:', error);
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
    const catObj = this.categories.find(c => ProductUtils.normalize(c.value) === catNorm);
    return catObj?.subsections ?? [];
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
    this.openAccordions.clear();
    this.openAccordions.add('categorias');
    this.applyFiltersSync();
    // Mantener SPA sin recarga total; actualizar solo URL sin navegación
    this.location.replaceState('/tienda');
    this.scrollToProductsTop();
  }

  applyFiltersAction(isMobile: boolean = false): void {
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

      const colorMatch = !this.selectedColors[p.id] || p.variants.some(v => v.color_name === this.selectedColors[p.id]);
      return include && colorMatch;
    });

    this.updatePagination();
    // Desbloquear altura tras recalculo
    this.unlockProductsContainer();
  }

  public async applyFilters(): Promise<void> {
    this.lockProductsContainer();
    this.loading = true;
    this.filteredProducts = [];
    await this.delay(500);
    this.applyFiltersSync();
    this.loadWishlistFromStorage();
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
}