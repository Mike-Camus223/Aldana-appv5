import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { FancyCarouselComponent } from '../fancy-carousel/fancy-carousel.component';
import { Product, ProductVariant, ProductImage } from '../../utils/models/Products-supabase.interface';

@Component({
  selector: 'app-items-purchase',
  templateUrl: './items-purchase.component.html',
  styleUrls: ['./items-purchase.component.css'],
  standalone: true,
  imports: [CommonModule, AccordionModule, FancyCarouselComponent]
})
export class ItemsPurchaseComponent implements OnInit {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  selectedSize: string | null = null;
  carouselImages: { src: string; thumb: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  async loadProduct(id: string) {
    const { data, error } = await this.supabaseService.getProducts(id);
    if (!error && data) {
      const productData = Array.isArray(data) ? data[0] : data;
      if (!productData) return;

      this.product = {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        details: productData.details,
        price: productData.price,
        category: productData.category,
        variants: productData.product_variants || [],
        product_images: [],
        mainImageUrl: '',
        colors: (productData.product_variants || []).map((v: any) => v.color),
      };

      const firstColor = this.product.colors[0];
      if (firstColor) this.selectColor(firstColor);
    }
  }

  selectColor(color: string) {
    if (!this.product || this.selectedVariant?.color === color) return;

    const newVariant = this.product.variants.find(v => v.color === color);
    if (!newVariant) return;

    this.selectedVariant = newVariant;
    this.selectedSize = null;

    this.carouselImages = newVariant.product_images.map((img: ProductImage) => ({
      src: img.image_url,
      thumb: img.image_url
    }));
  }

  selectSize(size: string) {
    this.selectedSize = size;
  }

  isColorSelected(color: string): boolean {
    return this.selectedVariant?.color === color;
  }
}
