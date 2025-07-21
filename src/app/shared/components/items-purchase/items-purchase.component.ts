import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { FancyCarouselComponent } from '../fancy-carousel/fancy-carousel.component';
import { Product, ProductVariant } from '../../utils/models/Products-supabase.interface';
import { CartItem } from '../../utils/models/cartItems-model';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { ProductUtils } from '../../utils/dataEx/products-utils';

@Component({
  selector: 'app-items-purchase',
  templateUrl: './items-purchase.component.html',
  styleUrls: ['./items-purchase.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    FancyCarouselComponent,
    RouterModule,
    ToastModule,
    FormsModule
  ]
})
export class ItemsPurchaseComponent implements OnInit {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  selectedSize: string | null = null;
  carouselImages: { src: string; thumb: string }[] = [];
  quantitySelected: number = 1;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private cartService: CartService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('slug');
    if (id) this.loadProduct(id);
  }

  async loadProduct(slug: string) {
  const { data, error } = await this.supabaseService.getProducts(slug);
  if (!error && data) {
    const productArray = Array.isArray(data) ? data : [data];
    const products = ProductUtils.mapProducts(productArray);
    this.product = products[0];
    
    if (!this.product) return;

    this.carouselImages = [
      { src: this.product.main_image, thumb: this.product.main_image },
      ...this.product.additional_images.map(img => ({ src: img, thumb: img }))
    ];

    if (this.product.variants.length > 0) {
      this.selectColor(this.product.variants[0].color_name);
    }
  }
}

selectColor(color: string) {
  if (!this.product || this.selectedVariant?.color_name === color) return;

  const newVariant = this.product.variants.find(v => v.color_name === color);
  if (!newVariant) return;

  this.selectedVariant = newVariant;
  this.selectedSize = null;

  const cleanMainImage = newVariant.main_image?.trim() || null;
  const hasAdditionalImages = newVariant.additional_images && newVariant.additional_images.length > 0;
  if (!cleanMainImage && !hasAdditionalImages) {
    this.carouselImages = [];
    return;
  }
  this.carouselImages = [];

  if (cleanMainImage) {
    this.carouselImages.push({ src: cleanMainImage, thumb: cleanMainImage });
  }

  if (hasAdditionalImages) {
    this.carouselImages.push(...(newVariant.additional_images ?? []).map(img => ({ src: img, thumb: img })));
  }
}



  addToCartItems() {
  if (!this.product || !this.selectedVariant || !this.selectedSize) {
    this.notificationService.showWarn(
      'Talla requerida',
      'Por favor, seleccione una talla antes de añadir al carrito.'
    );
    return;
  }

  const cleanVariantImage = this.selectedVariant.main_image?.trim();
  const variantImage = cleanVariantImage && cleanVariantImage !== '' ? cleanVariantImage : null;

  const cartItem: CartItem = {
    id: `${this.product.id}-${this.selectedVariant.color_name}-${this.selectedSize}`,
    name: this.product.name,
    price: this.product.price,
    image: this.product.main_image, 
    variantMainImage: variantImage ?? undefined,
    color: this.selectedVariant.color_name,
    size: this.selectedSize,
    quantity: this.quantitySelected
  };

  this.cartService.addToCart(cartItem);

  this.notificationService.showSuccess(
    'Producto añadido',
    `Se añadieron ${this.quantitySelected} unidad(es) al carrito.`
  );

  this.router.navigate(['/checkout/carrito']);
}


  selectSize(size: string) {
    this.selectedSize = size;
  }

  isColorSelected(color: string): boolean {
    return this.selectedVariant?.color_name === color;
  }
}
