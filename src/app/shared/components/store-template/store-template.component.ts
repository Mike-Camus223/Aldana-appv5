import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { Product, ProductImage, ProductVariant } from '../../utils/models/Products-supabase.interface';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

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
    ProgressSpinnerModule
  ],
  templateUrl: './store-template.component.html',
  styleUrls: ['./store-template.component.css']
})
export class StoreTemplateComponent implements OnInit {
  products: Product[] = [];
  allProducts: Product[] = [];
  selectedColors: Record<string, string> = {};
  selectedCategory: string | null = null;
  private wishlistKey = 'wishlistProducts';
  loading = true;

  sections = [
    { label: 'Camisas', value: 'camisas' },
    { label: 'Blusas', value: 'blusas' },
    { label: 'Faldas', value: 'faldas' },
    { label: 'Pantalón', value: 'pantalon' },
    { label: 'Abrigos', value: 'abrigos' },
    { label: 'Vestidos', value: 'vestidos' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(async params => {
      this.loading = true;
      const categoriaParam = params.get('categoria');
      const coloresParam = params.get('colores');
      const { data, error } = await this.supabaseService.getProducts();
      if (error) {
        this.loading = false;
        return;
      }
      if (Array.isArray(data) && data.length > 0) {
        this.products = this.mapProducts(data);
        this.allProducts = [...this.products];

        this.products.forEach(p => {
          this.selectedColors[p.id] = p.colors[0] || '';
        });

        if (coloresParam) {
          const colorPairs = coloresParam.split(',');
          colorPairs.forEach(pair => {
            const [id, color] = pair.split(':');
            if (id && color) this.selectedColors[id] = color;
          });
        }
        this.loadWishlistFromStorage();

        if (categoriaParam) {
          this.selectedCategory = this.normalize(categoriaParam);
        }
        this.refreshProducts();
      }
      this.loading = false;
    });
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
        category: p.category?.toLowerCase() || ''
      };
    });
  }

  toggleWishlist(product: Product): void {
    product.wishlisted = !product.wishlisted;
    this.saveWishlistToStorage();
  }

  private saveWishlistToStorage(): void {
    const wishlistedIds = this.products.filter(p => p.wishlisted).map(p => p.id);
    localStorage.setItem(this.wishlistKey, JSON.stringify(wishlistedIds));
  }

  private loadWishlistFromStorage(): void {
    const stored = localStorage.getItem(this.wishlistKey);
    if (!stored) return;

    try {
      const wishlistedIds: string[] = JSON.parse(stored);
      this.products.forEach(p => p.wishlisted = wishlistedIds.includes(p.id));
    } catch { }
  }

  async selectColor(productId: string, color: string): Promise<void> {
    if (this.selectedColors[productId] === color) return;
    this.selectedColors[productId] = color;

    const product = this.products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.color === color);
    const img = variant?.product_images.find(i => i.is_main) || variant?.product_images[0];
    if (product && img) product.mainImageUrl = img.image_url;
    this.updateQueryParamsWithoutReload();
  }

  private updateQueryParamsWithoutReload(): void {
    const queryParams: any = {
      categoria: this.selectedCategory || null
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

  filterByCategory(section: string): void {
    const normalized = this.normalize(section);
    if (this.selectedCategory === normalized) return;
    this.selectedCategory = normalized;
    this.updateQueryParams();
    this.refreshProducts();
  }

  private updateQueryParams(): void {
    const queryParams: any = {
      categoria: this.selectedCategory || null
    };
    const colorFilters = Object.entries(this.selectedColors)
      .filter(([_, color]) => !!color)
      .map(([id, color]) => `${id}:${color}`);

    if (colorFilters.length > 0) {
      queryParams.colores = colorFilters.join(',');
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private refreshProducts(): void {
    this.products = this.allProducts.filter(p =>
      (!this.selectedCategory || this.normalize(p.category) === this.selectedCategory) &&
      (!this.selectedColors[p.id] || p.variants.some(v => v.color === this.selectedColors[p.id]))
    );
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  trackByProductId(index: number, product: Product): string {
    return product.id;
  }
}
