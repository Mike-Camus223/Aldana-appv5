import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { FancyCarouselComponent } from '../../sections/fancy-carousel/fancy-carousel.component';
import { Product, ProductVariant } from '../../../utils/models/Products-supabase.interface';
import { CartItem } from '../../../utils/models/cartItems-model';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { CartService } from '../../../../core/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { ProductUtils } from '../../../utils/dataEx/products-utils';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, ShoppingBag } from 'lucide-angular';

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
    FormsModule,
    AcordiongenericComponent,
    LucideAngularModule
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ShoppingBag})
    }
  ]
})
export class ItemsPurchaseComponent implements OnInit {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  selectedSize: string | null = null;
  carouselImages: { src: string; thumb: string }[] = [];
  quantitySelected: number = 1;
  openAccordion: string | null = null;
  private initialColorParam: string | null = null;
  private initialSizeParam: string | null = null;
  private initialQuantityParam: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private cartService: CartService,
    private router: Router,
    private notificationService: NotificationService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.openAccordion = 'descripcion';
    const id = this.route.snapshot.paramMap.get('slug');
    const qp = this.route.snapshot.queryParamMap;
    this.initialColorParam = qp.get('color');
    this.initialSizeParam = qp.get('talla');
    const qtyRaw = qp.get('cantidad');
    if (qtyRaw) {
      const v = Number(qtyRaw);
      if (!Number.isNaN(v)) {
        this.initialQuantityParam = Math.min(5, Math.max(1, v));
      }
    }
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
        const normalized = (t: string) => ProductUtils.normalize(t);
        // Intentar aplicar color desde query param
        if (this.initialColorParam) {
          const targetColorNorm = normalized(this.initialColorParam);
          const match = this.product.variants.find(v => normalized(v.color_name) === targetColorNorm);
          if (match) {
            this.selectColor(match.color_name);
          } else {
            this.selectColor(this.product.variants[0].color_name);
          }
        } else {
          this.selectColor(this.product.variants[0].color_name);
        }
        // Intentar aplicar talla desde query param
        if (this.initialSizeParam) {
          const targetSize = String(this.initialSizeParam).toUpperCase();
          const sizes = (this.product.sizes || []).map(s => String(s).toUpperCase());
          if (sizes.includes(targetSize)) {
            this.selectedSize = targetSize;
          }
        }
        if (this.initialQuantityParam) {
          this.quantitySelected = this.initialQuantityParam;
        }
        this.updateUrlQuery(); // reflejar estado inicial amigable
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
    this.updateUrlQuery();
  }

  toggleAccordion(value: string) {
    this.openAccordion = this.openAccordion === value ? null : value;
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

    const existing = this.cartService.getCart().some(i => i.id === cartItem.id);
    if (existing) {
      this.cartService.setQuantity(cartItem.id, this.quantitySelected);
      this.notificationService.showSuccess(
        'Cantidad actualizada',
        `Se actualizó a ${this.quantitySelected} unidad(es) en el carrito.`
      );
    } else {
      this.cartService.addToCart(cartItem);
      this.notificationService.showSuccess(
        'Producto añadido',
        `Se añadieron ${this.quantitySelected} unidad(es) al carrito.`
      );
    }

    this.router.navigate(['/checkout/carrito']);
  }


  selectSize(size: string) {
    this.selectedSize = size;
    this.updateUrlQuery();
  }

  isColorSelected(color: string): boolean {
    return this.selectedVariant?.color_name === color;
  }

  private updateUrlQuery(): void {
    if (!this.product) return;
    const params: any = {};
    params['producto'] = null;
    if (this.selectedVariant?.color_name) {
      params['color'] = ProductUtils.normalize(this.selectedVariant.color_name);
    }
    if (this.selectedSize) {
      params['talla'] = String(this.selectedSize).toUpperCase();
    }
    if (this.quantitySelected && this.quantitySelected !== 1) {
      params['cantidad'] = String(this.quantitySelected);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  onQuantityChange(value: number) {
    const v = Number(value);
    this.quantitySelected = Math.min(5, Math.max(1, Number.isNaN(v) ? 1 : v));
    this.updateUrlQuery();
    this.updateCartQuantityInCart();
  }

  private updateCartQuantityInCart(): void {
    if (!this.product || !this.selectedVariant) return;
    const basePrefix = `${this.product.id}-${this.selectedVariant.color_name}-`;
    const cart = this.cartService.getCart();
    if (this.selectedSize) {
      const id = `${basePrefix}${this.selectedSize}`;
      if (cart.some(i => i.id === id)) {
        this.cartService.setQuantity(id, this.quantitySelected);
      }
      return;
    }
    const matches = cart.filter(i => i.id.startsWith(basePrefix));
    if (matches.length === 1) {
      this.cartService.setQuantity(matches[0].id, this.quantitySelected);
    }
  }
}
