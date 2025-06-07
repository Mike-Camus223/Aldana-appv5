 import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';

export interface ProductImage {
  id: string;
  image_url: string;
  is_main: boolean;
}

export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  product_images: ProductImage[];
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  variants: ProductVariant[];
  product_images: ProductImage[];
  mainImageUrl: string;
  colors: string[];
  category: string; 
  wishlisted?: boolean;
}

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



  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit() {
    try {
      const { data, error } = await this.supabaseService.getProducts();
      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        this.products = this.mapProducts(data);
        this.allProducts = [...this.products];
        this.loadWishlistFromStorage();
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  }

  mapProducts(data: any[]): Product[] {
  return data.map(p => {
    const variants: ProductVariant[] = p.product_variants || [];
    const colors = Array.from(new Set(variants.map(v => v.color)));
    const allImages = variants.flatMap(v => v.product_images || []);
    const mainImage = allImages.find(img => img.is_main) || allImages[0] || { image_url: '' };
    const basePrice = variants.length > 0 ? variants[0].price : 0;

    const normalizedCategory = p.category?.toLowerCase() || '';
    const productId = p.id;

    if (colors.length > 0) {
      this.selectedColors[productId] = colors[0];
    }

    return {
      id: productId,
      name: p.name,
      description: p.description,
      price: basePrice,
      variants,
      product_images: allImages,
      mainImageUrl: mainImage.image_url,
      colors,
      wishlisted: false,
      category: normalizedCategory
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
      this.products.forEach(p => {
        p.wishlisted = wishlistedIds.includes(p.id);
      });
    } catch (e) {
      console.error('Error leyendo wishlist desde localStorage', e);
    }
  }

async selectColor(productId: string, color: string): Promise<void> {
  this.selectedColors[productId] = color;

  const product = this.products.find(p => p.id === productId);
  if (product) {
    const variant = product.variants.find(v => v.color === color);
    if (variant) {
      const mainImg = variant.product_images.find(img => img.is_main) || variant.product_images[0];
      if (mainImg) {
        product.mainImageUrl = mainImg.image_url;
      }
    }
  }

  this.refreshProducts();
}


  filterByCategory(section: string): void {
  const normalize = (text: string): string =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const selected = normalize(section);

  if (this.selectedCategory === selected) {
    this.selectedCategory = null;
    this.refreshProducts();
  } else {
    this.selectedCategory = selected;
    this.refreshProducts();
  }
}

refreshProducts(): void {
  console.log('Categoría seleccionada:', this.selectedCategory);
  this.products = this.allProducts.filter(p => this.matchCategory(p) && this.matchColor(p));
}


private matchCategory(p: Product): boolean {
  return !this.selectedCategory || this.normalize(p.category) === this.selectedCategory;
}



private matchColor(p: Product): boolean {
  const selectedColor = this.selectedColors[p.id];
  return !selectedColor || p.variants.some(v => v.color === selectedColor);
}


normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}


} 