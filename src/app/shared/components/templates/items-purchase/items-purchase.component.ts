import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { ToastModule } from 'primeng/toast';
import { FancyCarouselComponent } from '../../sections/fancy-carousel/fancy-carousel.component';
import { ProductCarouselComponent } from '../../sections/product-carousel/product-carousel.component';
import { Product, ProductVariant } from '../../../utils/models/Products-supabase.interface';
import { CartItem } from '../../../utils/models/cartItems-model';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { CartService } from '../../../../core/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { ProductUtils } from '../../../utils/dataEx/products-utils';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Package, ShoppingBag } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { ProductsService } from '../../../../core/services/data-access/products/products.service';

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
    LucideAngularModule,
    ProductCarouselComponent
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ShoppingBag,Package})
    }
  ]
})
export class ItemsPurchaseComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  selectedSize: string | null = null;
  carouselImages: { src: string; thumb: string }[] = [];
  quantitySelected: number = 1;

  // Flag to toggle color-specific variant images in carousel
  enableColorImageChange = false;
  relatedProducts: Product[] = [];
  private initialColorParam: string | null = null;
  private initialSizeParam: string | null = null;
  private initialQuantityParam: number | null = null;
  private qpSub?: Subscription;
  private paramSub?: Subscription;
  private currentSlug: string | null = null;

  constructor(
    private productsService: ProductsService,
    private route: ActivatedRoute,
    private bridesProductsService: BridesProductsService,
    private cartService: CartService,
    private router: Router,
    private notificationService: NotificationService,
  ) { }

  ngOnInit(): void {
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

    this.paramSub = this.route.paramMap.subscribe(pm => {
      const slug = pm.get('slug');
      if (slug && slug !== this.currentSlug) {
        this.loadProduct(slug);
      }
    });

    this.qpSub = this.route.queryParamMap.subscribe(qpm => {
      if (!this.product) {
        this.initialColorParam = qpm.get('color');
        this.initialSizeParam = qpm.get('talla');
        const qtyRt = qpm.get('cantidad');
        if (qtyRt) {
          const v = Number(qtyRt);
          if (!Number.isNaN(v)) {
            this.initialQuantityParam = Math.min(5, Math.max(1, v));
          }
        }
        return;
      }
      const colorParam = qpm.get('color');
      if (colorParam) {
        const targetLc = colorParam.toLowerCase();
        const match = this.product.variants.find(v => String(v.color_name).toLowerCase() === targetLc);
        if (match && (!this.selectedVariant || String(this.selectedVariant.color_name).toLowerCase() !== targetLc)) {
          this.selectColor(match.color_name, true);
        }
      }
      const tallaParam = qpm.get('talla');
      if (tallaParam && !this.product.isBridal) {
        const targetSizeLc = tallaParam.toLowerCase();
        const sizes = this.product.sizes || [];
        const matchSize = sizes.find(s => String(s).toLowerCase() === targetSizeLc);
        if (matchSize && this.selectedSize !== matchSize) {
          this.selectedSize = matchSize;
        }
      } else {
        if (this.selectedSize) {
          this.selectedSize = null;
        }
      }
      const qtyParam = qpm.get('cantidad');
      if (qtyParam !== null) {
        const v = Number(qtyParam);
        const clamped = Math.min(5, Math.max(1, Number.isNaN(v) ? 1 : v));
        if (this.quantitySelected !== clamped) {
          this.quantitySelected = clamped;
          this.updateCartQuantityInCart();
        }
      } else {
        if (this.quantitySelected !== 1) {
          this.quantitySelected = 1;
          this.updateCartQuantityInCart();
        }
      }
    });
  }

  async loadProduct(slug: string) {
    this.currentSlug = slug;
    let mappedProduct: Product | null = null;

    // 1) Intentar en módulo normal (Pret a Porter)
    const normalRes = await this.productsService.getProducts(slug);
    if (!normalRes.error && normalRes.data) {
      const productArray = Array.isArray(normalRes.data) ? normalRes.data : [normalRes.data];
      const products = ProductUtils.mapProducts(productArray, false);
      mappedProduct = products[0] || null;
    }

    // 2) Si no existe en normal, intentar en módulo Novias
    if (!mappedProduct) {
      const bridalRes: any = await this.bridesProductsService.getProducts(slug);
      const bridalData = bridalRes?.data;
      if (!bridalRes?.error && bridalData) {
        const productArray = Array.isArray(bridalData) ? bridalData : [bridalData];
        const products = ProductUtils.mapProducts(productArray, true);
        mappedProduct = products[0] || null;
      }
    }

    this.product = mappedProduct;
    if (this.product) {
      // Intentar obtener media de uso 'product' o 'collection' (para bridal)
      const productMedia = this.product.media.filter(m => 
        m.use?.includes('product') || m.use?.includes('collection')
      );
      
      this.carouselImages = [
        { src: this.product.main_image, thumb: this.product.main_image },
        ...productMedia.map(m => ({ src: m.url, thumb: m.poster || m.url }))
      ];

      // Load related products (non-blocking)
      this.loadRelatedProducts();

      if (this.product.variants.length > 0) {
        // Intentar aplicar color desde query param usando valor real (sin normalizar)
        if (this.initialColorParam) {
          const targetColorLc = String(this.initialColorParam).toLowerCase();
          const match = this.product.variants.find(v => String(v.color_name).toLowerCase() === targetColorLc);
          this.selectColor(match ? match.color_name : this.product.variants[0].color_name);
        } else {
          this.selectColor(this.product.variants[0].color_name);
        }
        // Intentar aplicar talla desde query param usando valor real (sin uppercasing)
        if (this.initialSizeParam && !this.product.isBridal) {
          const targetSizeLc = String(this.initialSizeParam).toLowerCase();
          const sizes = this.product.sizes || [];
          const matchSize = sizes.find(s => String(s).toLowerCase() === targetSizeLc);
          if (matchSize) {
            this.selectedSize = matchSize;
          }
        }
        if (this.initialQuantityParam) {
          this.quantitySelected = this.initialQuantityParam;
        }
        this.updateUrlQuery(true);
      }
    } else {
      this.product = null;
      this.relatedProducts = [];
    }
  }

  selectColor(color: string, silent: boolean = false) {
    if (!this.product || this.selectedVariant?.color_name === color) return;
    const newVariant = this.product.variants.find(v => v.color_name === color);
    if (!newVariant) return;
    this.selectedVariant = newVariant;
    this.selectedSize = null;
    
    if (this.enableColorImageChange) {
      const cleanMainImage = newVariant.main_image?.trim() || null;
      
      // Intentar obtener media de uso 'product' o 'collection' (para bridal)
      const variantMedia = newVariant.media.filter(m => 
        m.use?.includes('product') || m.use?.includes('collection')
      );
      
      const hasMedia = variantMedia.length > 0;
      if (!cleanMainImage && !hasMedia) {
        this.carouselImages = [];
        return;
      }
      this.carouselImages = [];

      if (cleanMainImage) {
        this.carouselImages.push({ src: cleanMainImage, thumb: cleanMainImage });
      }

      if (hasMedia) {
        this.carouselImages.push(...variantMedia.map(m => ({ src: m.url, thumb: m.poster || m.url })));
      }
    }
    
    if (!silent) {
      this.updateUrlQuery();
    }
  }

  addToCartItems() {
    if (!this.product || !this.selectedVariant || (!this.product.isBridal && !this.selectedSize)) {
      this.notificationService.showWarn(
        'Talla requerida',
        'Por favor, seleccione una talla antes de añadir al carrito.'
      );
      return;
    }

    const cleanVariantImage = this.selectedVariant.main_image?.trim();
    const variantImage = cleanVariantImage && cleanVariantImage !== '' ? cleanVariantImage : null;

    // Buscar imagen para el carrito (uso 'shop' según requerimiento)
    const variantShopMedia = ProductUtils.getMediaByUse(this.selectedVariant.media, 'shop');
    const productShopMedia = ProductUtils.getMediaByUse(this.product.media, 'shop');
    
    const shopImage = (variantShopMedia.length > 0) ? variantShopMedia[0].url : 
                      (productShopMedia.length > 0) ? productShopMedia[0].url : null;

    const sizeValue = this.product.isBridal ? 'Unique' : this.selectedSize;
    const cartItemId = this.product.isBridal 
      ? `${this.product.id}-${this.selectedVariant.color_name}`
      : `${this.product.id}-${this.selectedVariant.color_name}-${this.selectedSize}`;

    const cartItem: CartItem = {
      id: cartItemId,
      name: this.product.name,
      price: this.product.price,
      image: shopImage || this.product.main_image,
      variantMainImage: variantImage || shopImage || undefined,
      color: this.selectedVariant.color_name,
      size: sizeValue || '',
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


  selectSize(size: string, silent: boolean = false) {
    this.selectedSize = size;
    if (!silent) {
      this.updateUrlQuery();
    }
  }

  isColorSelected(color: string): boolean {
    return this.selectedVariant?.color_name === color;
  }

  private updateUrlQuery(replace: boolean = false): void {
    if (!this.product) return;
    const params: any = {};
    params['producto'] = null;
    if (this.selectedVariant?.color_name) {
      params['color'] = this.selectedVariant.color_name;
    }
    if (this.selectedSize) {
      params['talla'] = String(this.selectedSize);
    }
    if (this.quantitySelected && this.quantitySelected !== 1) {
      params['cantidad'] = String(this.quantitySelected);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: replace
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
    const cartItemId = this.product.isBridal 
      ? `${this.product.id}-${this.selectedVariant.color_name}`
      : `${this.product.id}-${this.selectedVariant.color_name}-${this.selectedSize}`;
      
    const cart = this.cartService.getCart();
    if (cart.some(i => i.id === cartItemId)) {
      this.cartService.setQuantity(cartItemId, this.quantitySelected);
    }
  }

  private async loadRelatedProducts(): Promise<void> {
    if (!this.product) return;

    try {
      let data: Product[] = [];
      let error: any = null;

      // Intentar obtener productos relacionados por categoría en ambos servicios (en paralelo)
      if (this.product.category_id) {
        const [resNormal, resBridal] = await Promise.all([
          this.productsService.getProductsByCategory(String(this.product.category_id), 12),
          this.bridesProductsService.getProductsByCategory(String(this.product.category_id), 12)
        ]);

        const productsNormal = ProductUtils.mapProducts(resNormal.data || [], false);
        const productsBridal = ProductUtils.mapProducts(resBridal.data || [], true);
        
        data = [...productsNormal, ...productsBridal];
      }

      if (data.length === 0) return;

      const allProducts = data;
      
      // Filter related products
      const related = allProducts.filter((p: Product) => p.id !== this.product!.id);

      this.relatedProducts = related.slice(0, 6);
    } catch (error) {
      console.error('Error loading related products:', error);
      this.relatedProducts = [];
    }
  }

  ngOnDestroy(): void {
    this.qpSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }
}
