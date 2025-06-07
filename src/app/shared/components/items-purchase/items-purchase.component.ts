import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { FancyCarouselComponent } from '../fancy-carousel/fancy-carousel.component';

@Component({
  selector: 'app-items-purchase',
  templateUrl: './items-purchase.component.html',
  styleUrls: ['./items-purchase.component.css'],
  imports: [CommonModule, AccordionModule, FancyCarouselComponent]
})
export class ItemsPurchaseComponent implements OnInit {
  product: any = null;
  selectedColors: { [productId: string]: string } = {};
  selectedSize: string | null = null;
  selectedVariant: any = null;
  carouselImages: { src: string; thumb: string }[] = [];

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  async loadProduct(id: string) {
    const { data, error } = await this.supabaseService.getProducts(id);
    if (!error && data) {
      this.product = data;
      // Seleccionar el primer color por defecto
      const firstColor = this.getUniqueColors()[0];
      if (firstColor) {
        this.selectColor(firstColor);
      }
    }
  }

  getUniqueColors(): string[] {
    if (!this.product || !this.product.product_variants) {
      return [];
    }
    const colors = this.product.product_variants.map((v: any) => v.color);
    return Array.from(new Set(colors));
  }

  selectColor(color: string) {
    if (!this.product) return;
    this.selectedColors[this.product.id] = color;
    // Encontrar la variante que coincide con ese color
    this.selectedVariant = this.product.product_variants.find(
      (v: any) => v.color === color
    );
    this.selectedSize = null;
    // Actualizar imágenes del carousel
    if (this.selectedVariant?.product_images) {
      this.carouselImages = this.selectedVariant.product_images.map((img: any) => ({
        src: img.image_url,
        thumb: img.image_url
      }));
    } else {
      this.carouselImages = [];
    }
  }

  selectSize(size: string) {
    this.selectedSize = size;
  }
}
