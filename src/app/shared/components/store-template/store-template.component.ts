import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { Product, ProductImage, ProductVariant } from '../../utils/models/Products-supabase.interface';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { AldyCheckboxV1Directive } from '../../utils/directives/aldy-checkbox-v1.directive';

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
  activeAccordion: number = 0;

  selectedSubcategory: string | null = null;

  categories = [
    {
      label: 'Camisas',
      value: 'camisas',
      subsections: [
        { label: 'Camisas 1', value: 'camisas 1' },
        { label: 'Camisas 2', value: 'camisas 2' },
        { label: 'Camisas 3', value: 'camisas 3' }
      ]
    },
    {
      label: 'Blusas',
      value: 'blusas',
      subsections: [
        { label: 'Blusas 1', value: 'blusas 1' },
        { label: 'Blusas 2', value: 'blusas 2' },
        { label: 'Blusas 3', value: 'blusas 3' }
      ]
    },
    {
      label: 'Faldas',
      value: 'faldas',
      subsections: [
        { label: 'Faldas 1', value: 'faldas 1' },
        { label: 'Faldas 2', value: 'faldas 2' },
        { label: 'Faldas 3', value: 'faldas 3' }
      ]
    },
    {
      label: 'Pantalón',
      value: 'pantalon',
      subsections: [
        { label: 'Pantalón 1', value: 'pantalon 1' },
        { label: 'Pantalón 2', value: 'pantalon 2' },
        { label: 'Pantalón 3', value: 'pantalon 3' }
      ]
    },
    {
      label: 'Abrigos',
      value: 'abrigos',
      subsections: [
        { label: 'Campera', value: 'campera' },
        { label: 'Buzos', value: 'buzos' },
        { label: 'Chalecos', value: 'chalecos' },
        { label: 'Blazers', value: 'blazers' },
        { label: 'Tapados', value: 'tapados' }
      ]
    },
    {
      label: 'Vestidos',
      value: 'vestidos',
      subsections: [
        { label: 'Vestidos 1', value: 'vestidos 1' },
        { label: 'Vestidos 2', value: 'vestidos 2' },
        { label: 'Vestidos 3', value: 'vestidos 3' }
      ]
    },
    {
      label: 'Remeras',
      value: 'remeras',
      subsections: [
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
    this.route.queryParamMap.subscribe(async params => {
      this.loading = true;
      const categoriaParam = params.get('categoria');
      const subcategoriaParam = params.get('subcategoria');
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

        if (subcategoriaParam) {
          this.selectedSubcategory = this.normalize(subcategoriaParam);
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
        category: p.categories?.name?.toLowerCase() || '',
        subcategory: p.subcategories?.name?.toLowerCase() || ''
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
      this.products.forEach(p => (p.wishlisted = wishlistedIds.includes(p.id)));
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

  filterByMainCategory(categoryValue: string): void {
    const normalized = this.normalize(categoryValue);
    if (this.selectedCategory === normalized) return;
    this.selectedCategory = normalized;
    this.selectedSubcategory = null;
    this.updateQueryParams();
    this.refreshProducts();
  }

  public updateQueryParams(): void {
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
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  public refreshProducts(): void {
    this.products = this.allProducts.filter(p => {
      const productCategory = this.normalize(p.category);
      const productSubcategory = this.normalize(p.subcategory || '');

      const categoryMatch = !this.selectedCategory || productCategory === this.selectedCategory;
      const subcategoryMatch = !this.selectedSubcategory || productSubcategory === this.selectedSubcategory;

      const colorMatch = !this.selectedColors[p.id] || p.variants.some(v => v.color === this.selectedColors[p.id]);

      return categoryMatch && subcategoryMatch && colorMatch;
    });
  }

  private normalize(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  trackByProductId(index: number, product: Product): string {
    return product.id;
  }
}
