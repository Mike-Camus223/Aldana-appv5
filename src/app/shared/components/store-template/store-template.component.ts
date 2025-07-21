import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-store-template',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    CheckboxModule,
    SliderModule,
    FormsModule,
    RouterModule,
    ProgressSpinnerModule,
    CardproductComponent,
    LucideAngularModule
],
  templateUrl: './store-template.component.html',
  styleUrls: ['./store-template.component.css'],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Funnel,
         ChevronDown,
        ChevronUp
      })
    } 
  ],
})
export class StoreTemplateComponent implements OnInit {
  products: Product[] = [];
  allProducts: Product[] = [];
  selectedColors: Record<string, string> = {};
  selectedCategory: string | null = null;
  selectedSubcategory: string | null = null;
  private wishlistKey = 'wishlistProducts';
  loading = true;
  activeAccordion: number = 0;
  showFilters = false;

  
  categories = [
    { label: 'Camisas', value: 'camisas', subsections: [{ label: 'Camisas 1', value: 'camisas 1' }, { label: 'Camisas 2', value: 'camisas 2' }, { label: 'Camisas 3', value: 'camisas 3' }] },
    { label: 'Blusas', value: 'blusas', subsections: [{ label: 'Blusas 1', value: 'blusas 1' }, { label: 'Blusas 2', value: 'blusas 2' }, { label: 'Blusas 3', value: 'blusas 3' }] },
    { label: 'Faldas', value: 'faldas', subsections: [{ label: 'Faldas 1', value: 'faldas 1' }, { label: 'Faldas 2', value: 'faldas 2' }, { label: 'Faldas 3', value: 'faldas 3' }] },
    { label: 'Pantalón', value: 'pantalon', subsections: [{ label: 'Pantalón 1', value: 'pantalon 1' }, { label: 'Pantalón 2', value: 'pantalon 2' }, { label: 'Pantalón 3', value: 'pantalon 3' }] },
    { label: 'Abrigos', value: 'abrigos', subsections: [{ label: 'Campera', value: 'campera' }, { label: 'Buzos', value: 'buzos' }, { label: 'Chalecos', value: 'chalecos' }, { label: 'Blazers', value: 'blazers' }, { label: 'Tapados', value: 'tapados' }] },
    { label: 'Vestidos', value: 'vestidos', subsections: [{ label: 'Vestidos 1', value: 'vestidos 1' }, { label: 'Vestidos 2', value: 'vestidos 2' }, { label: 'Vestidos 3', value: 'vestidos 3' }] },
    { label: 'Remeras', value: 'remeras', subsections: [{ label: 'Remeras 1', value: 'remeras 1' }, { label: 'Remeras 2', value: 'remeras 2' }, { label: 'Remeras 3', value: 'remeras 3' }] }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(async params => {
      this.loading = true;

      const categoriaParam = params.get('categoria');
      const subcategoriaParam = params.get('subcategoria');

      const { data, error } = await this.supabaseService.getProducts();
      if (error) {
        this.loading = false;
        return;
      }

      if (Array.isArray(data)) {
        this.products = ProductUtils.mapProducts(data);
        this.allProducts = [...this.products];

        this.products.forEach(p => {
          this.selectedColors[p.id] = p.variants[0]?.color_name || '';
        });

        this.loadWishlistFromStorage();

        this.selectedCategory = categoriaParam ? ProductUtils.normalize(categoriaParam) : null;
        this.selectedSubcategory = subcategoriaParam ? ProductUtils.normalize(subcategoriaParam) : null;

        this.refreshProducts();
      }

      this.loading = false;
    });
  }

  toggleWishlist(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    product.wishlisted = !product.wishlisted;
    this.saveWishlistToStorage();
  }

  private saveWishlistToStorage(): void {
    const wishlistedIds = this.products.filter(p => p.wishlisted).map(p => p.id);
    localStorage.setItem(this.wishlistKey, JSON.stringify(wishlistedIds));
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  private loadWishlistFromStorage(): void {
    const stored = localStorage.getItem(this.wishlistKey);
    if (!stored) return;

    try {
      const wishlistedIds: string[] = JSON.parse(stored);
      this.products.forEach(p => (p.wishlisted = wishlistedIds.includes(p.id)));
    } catch { }
  }

  selectColor(event: { productId: string, color: string }): void {
    const { productId, color } = event;
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    if (this.selectedColors[productId] === color) return;

    this.selectedColors[productId] = color;

    const selectedVariant = product.variants.find(v => v.color_name === color);

    if (selectedVariant && selectedVariant.color_name && selectedVariant.color_hex) {
      product.main_image = selectedVariant.main_image ?? '';
      product.additional_images = selectedVariant.additional_images ?? [];
    } else {
      product.main_image = '';
      product.additional_images = [];
    }
  }

  filterByMainCategory(categoryValue: string): void {
    const normalized = ProductUtils.normalize(categoryValue);
    if (this.selectedCategory === normalized) return;

    this.router.navigate(['/tienda/categoria', normalized]);
  }

  navigateToSubcategory(category: string, subcategory: string): void {
    const normalizedCategory = ProductUtils.normalize(category);
    const normalizedSubcategory = ProductUtils.normalize(subcategory);

    this.router.navigate(['/tienda/categoria', normalizedCategory, 'subcategoria', normalizedSubcategory]);
  }

  public refreshProducts(): void {
    this.products = this.allProducts.filter(p => {
      const productCategory = ProductUtils.normalize(typeof p.category === 'string' ? p.category : (p.category?.name ?? ''));
      const productSubcategory = ProductUtils.normalize(typeof p.subcategory === 'string' ? p.subcategory : (p.subcategory?.name ?? ''));

      const categoryMatch = !this.selectedCategory || productCategory === this.selectedCategory;
      const subcategoryMatch = !this.selectedSubcategory || productSubcategory === this.selectedSubcategory;

      const colorMatch = !this.selectedColors[p.id] || p.variants.some(v => v.color_name === this.selectedColors[p.id]);

      return categoryMatch && subcategoryMatch && colorMatch;
    });
  }

  trackByProductId(index: number, product: Product): string {
    return product.slug;
  }

  public normalize(text: string): string {
    return ProductUtils.normalize(text);
  }
}
