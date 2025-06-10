import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { FancyCarouselComponent } from '../fancy-carousel/fancy-carousel.component';
import { Product, ProductVariant, ProductImage } from '../../utils/models/Products-supabase.interface';
import { CartItem } from '../../utils/models/cartItems-model';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';

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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProduct(id);
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
        colors: (productData.product_variants || []).map((v: any) => v.color)
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

  addToCartItems() {
  if (!this.product || !this.selectedVariant || !this.selectedSize) {
    this.notificationService.showWarn(
      'Talla requerida',
      'Por favor, seleccione una talla antes de añadir al carrito.'
    );
    return;
  }

  const image = this.selectedVariant.product_images.find(img => img.is_main)?.image_url
    || this.selectedVariant.product_images[0]?.image_url
    || '';

  const cartItem: CartItem = {
    id: `${this.product.id}-${this.selectedVariant.color}-${this.selectedSize}`,
    name: this.product.name,
    price: this.product.price,
    image: image,
    color: this.selectedVariant.color,
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
    return this.selectedVariant?.color === color;
  }
}
