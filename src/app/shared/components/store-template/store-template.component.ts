import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { Product, ProductImage, ProductVariant } from '../../utils/models/Products-supabase.interface';

@Component({
  selector: 'app-store-template',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    CheckboxModule,
    SliderModule,
    FormsModule,
    RouterModule
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

  sections = [
    { label: 'Camisas', value: 'camisas' },
    { label: 'Blusas', value: 'blusas' },
    { label: 'Faldas', value: 'faldas' },
    { label: 'Pantalón', value: 'pantalon' },
    { label: 'Abrigos', value: 'abrigos' },
    { label: 'Vestidos', value: 'vestidos' }
  ];

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    const { data, error } = await this.supabaseService.getProducts();
    if (data?.length) {
      this.products = this.mapProducts(data);
      this.allProducts = [...this.products];
      this.loadWishlistFromStorage();
    }
  }

  private mapProducts(data: any[]): Product[] {
    return data.map(p => {
      const variants: ProductVariant[] = p.product_variants || [];
      const colors = [...new Set(variants.map(v => v.color))];
      const allImages: ProductImage[] = variants.flatMap(v => v.product_images || []);
      const mainImage = allImages.find(img => img.is_main) || allImages[0] || { image_url: '' };
      const price = variants.length ? variants[0].price : 0;
      const id = p.id;
      const category = p.category?.toLowerCase() || '';

      if (colors.length) this.selectedColors[id] = colors[0];

      return {
        id,
        name: p.name,
        description: p.description,
        price,
        variants,
        product_images: allImages,
        mainImageUrl: mainImage.image_url,
        colors,
        wishlisted: false,
        category
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
    } catch {}
  }

  async selectColor(productId: string, color: string): Promise<void> {
    this.selectedColors[productId] = color;
    const product = this.products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.color === color);
    const img = variant?.product_images.find(i => i.is_main) || variant?.product_images[0];
    if (product && img) product.mainImageUrl = img.image_url;
    this.refreshProducts();
  }

  filterByCategory(section: string): void {
    const normalized = this.normalize(section);
    this.selectedCategory = this.selectedCategory === normalized ? null : normalized;
    this.refreshProducts();
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
}
