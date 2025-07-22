import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { Product } from '../../utils/models/Products-supabase.interface';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { ProductUtils } from '../../utils/dataEx/products-utils';
import { CardproductComponent } from '../cardproduct/cardproduct.component';
import { Funnel, LUCIDE_ICONS, LucideIconProvider, LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AcordiongenericComponent } from '../acordiongeneric/acordiongeneric.component';
import { LoadingbarComponent } from '../loadingbar/loadingbar.component';

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
    LoadingbarComponent
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
  private wishlistKey = 'wishlistProducts';
  loading = true;
  activeAccordion: number = 0;
  showFilters = false;
  productColumns: number = 4;
  isMobileView = false;
  selectedAccordion: string | null = null;

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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.checkMobileView();
    this.initializeRoute();
  }

  ngOnDestroy(): void {
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkMobileView();
    if (!this.isMobileView && this.showFilters) {
      this.showFilters = false;
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
        this.selectedCategory = categoriaParam ? ProductUtils.normalize(categoriaParam) : null;
        this.selectedSubcategory = subcategoriaParam ? ProductUtils.normalize(subcategoriaParam) : null;
        this.selectedAccordion = this.selectedCategory;
        this.applyFiltersSync();
        this.loadWishlistFromStorage();

        this.loading = false;

      } catch (error) {
        console.error('Error in initializeRoute:', error);
        this.loading = false;
      }
    });
  }

  checkMobileView(): void {
    this.isMobileView = window.innerWidth < 1024;
  }

  setProductColumns(cols: number): void {
    if (cols >= 2 && cols <= 4) {
      this.productColumns = cols;
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (this.isMobileView) {
      document.body.style.overflow = this.showFilters ? 'hidden' : 'auto';
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

  filterByMainCategory(categoryValue: string): void {
    const normalized = ProductUtils.normalize(categoryValue);
    if (this.selectedCategory === normalized) return;
    this.selectedCategory = normalized;
    this.selectedSubcategory = null;
    this.selectedAccordion = normalized;
    this.applyFiltersSync();
    this.router.navigate(['/tienda/categoria', normalized]);
  }

  navigateToSubcategory(category: string, subcategory: string): void {
    this.loading = true;

    const normalizedCategory = ProductUtils.normalize(category);
    const normalizedSubcategory = ProductUtils.normalize(subcategory);

    if (this.selectedCategory === normalizedCategory && this.selectedSubcategory === normalizedSubcategory) {
      this.loading = false;
      return;
    }

    this.selectedCategory = normalizedCategory;
    this.selectedSubcategory = normalizedSubcategory;
    this.selectedAccordion = normalizedCategory;

    this.applyFilters().then(() => {
      this.router.navigate(['/tienda/categoria', normalizedCategory, 'subcategoria', normalizedSubcategory]);
    });
  }

  onSubcategorySelected(category: string, subcategory: string): void {
    const normalizedCategory = ProductUtils.normalize(category);
    const normalizedSubcategory = ProductUtils.normalize(subcategory);
    this.selectedCategory = normalizedCategory;
    this.selectedSubcategory = normalizedSubcategory;
    this.selectedAccordion = normalizedCategory;
  }

  applyFiltersMobile(): void {
    this.applyFilters().then(() => {
      this.toggleFilters();
      this.router.navigate(this.buildFilterRoute());
    });
  }

  private buildFilterRoute(): string[] {
    if (!this.selectedCategory) return ['/tienda'];

    const route = ['/tienda/categoria', this.selectedCategory];
    if (this.selectedSubcategory) {
      route.push('subcategoria', this.selectedSubcategory);
    }

    return route;
  }



  onOverlayClick(event: MouseEvent): void {
    this.toggleFilters();
  }

  stopSidebarClick(event: MouseEvent): void {
    event.stopPropagation();
  }
  private applyFiltersSync(): void {
    this.filteredProducts = this.allProducts.filter(p => {
      const productCategory = ProductUtils.normalize(
        typeof p.category === 'string' ? p.category : (p.category?.name ?? '')
      );
      const productSubcategory = ProductUtils.normalize(
        typeof p.subcategory === 'string' ? p.subcategory : (p.subcategory?.name ?? '')
      );
      const categoryMatch = !this.selectedCategory || productCategory === this.selectedCategory;
      const subcategoryMatch = !this.selectedSubcategory || productSubcategory === this.selectedSubcategory;
      const colorMatch = !this.selectedColors[p.id] || p.variants.some(v => v.color_name === this.selectedColors[p.id]);
      return categoryMatch && subcategoryMatch && colorMatch;
    });
  }

  public async applyFilters(): Promise<void> {
    this.loading = true;
    this.filteredProducts = [];
    await this.delay(500);
    this.applyFiltersSync();
    this.loadWishlistFromStorage();
    this.loading = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  trackByProductId(index: number, product: Product): string {
    return product.slug || product.id;
  }

  public normalize(text: string): string {
    return ProductUtils.normalize(text);
  }

  onAccordionToggled(value: string): void {
    if (this.selectedAccordion === value) {
      this.selectedAccordion = null;

    } else {
      this.selectedAccordion = value;
      this.selectedCategory = value;
      this.selectedSubcategory = null;
      this.applyFiltersSync();
      this.applyFilters();
    }
  }


}