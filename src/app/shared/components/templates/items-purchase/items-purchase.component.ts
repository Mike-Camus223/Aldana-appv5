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
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, ShoppingBag } from 'lucide-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-items-purchase',
  templateUrl: './items-purchase.component.html',
  styleUrls: ['./items-purchase.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    FancyCarouselComponent,
    ProductCarouselComponent,
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
export class ItemsPurchaseComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  selectedVariant: ProductVariant | null = null;
  selectedSize: string | null = null;
  carouselImages: { src: string; thumb: string }[] = [];
  quantitySelected: number = 1;
  openAccordion: string | null = null;
  relatedProducts: Product[] = [];
  private initialColorParam: string | null = null;
  private initialSizeParam: string | null = null;
  private initialQuantityParam: number | null = null;
  private qpSub?: Subscription;
  private paramSub?: Subscription;
  private currentSlug: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private bridesProductsService: BridesProductsService,
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
      if (tallaParam) {
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
    const normalRes = await this.supabaseService.getProducts(slug);
    if (!normalRes.error && normalRes.data) {
      const productArray = Array.isArray(normalRes.data) ? normalRes.data : [normalRes.data];
      const products = ProductUtils.mapProducts(productArray);
      mappedProduct = products[0] || null;
    }

    // 2) Si no existe en normal, intentar en módulo Novias
    if (!mappedProduct) {
      const bridalRes: any = await this.bridesProductsService.getProducts(slug);
      const bridalData = bridalRes?.data;
      if (!bridalRes?.error && bridalData) {
        const productArray = Array.isArray(bridalData) ? bridalData : [bridalData];
        const products = ProductUtils.mapProducts(productArray);
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

      // Load related products
      await this.loadRelatedProducts();

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
        if (this.initialSizeParam) {
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
    if (!silent) {
      this.updateUrlQuery();
    }
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

    // Buscar imagen para el carrito (uso 'shop' según requerimiento)
    const variantShopMedia = ProductUtils.getMediaByUse(this.selectedVariant.media, 'shop');
    const productShopMedia = ProductUtils.getMediaByUse(this.product.media, 'shop');
    
    const shopImage = (variantShopMedia.length > 0) ? variantShopMedia[0].url : 
                      (productShopMedia.length > 0) ? productShopMedia[0].url : null;

    const cartItem: CartItem = {
      id: `${this.product.id}-${this.selectedVariant.color_name}-${this.selectedSize}`,
      name: this.product.name,
      price: this.product.price,
      image: shopImage || this.product.main_image,
      variantMainImage: variantImage || shopImage || undefined,
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

  private async loadRelatedProducts(): Promise<void> {
    if (!this.product) return;

    try {
      // Get all products to filter related ones
      const { data, error } = await this.supabaseService.getProducts();
      if (error || !data) return;

      const allProducts = ProductUtils.mapProducts(Array.isArray(data) ? data : [data]);
      
      // Filter related products based on current product characteristics
      const related = allProducts.filter(p => {
        // Don't include the current product
        if (p.id === this.product!.id) return false;
        
        // Simple recommendation logic for now
        // 1. Same category/brand (if product name contains similar words)
        const currentProductName = this.product!.name.toLowerCase();
        const candidateProductName = p.name.toLowerCase();
        
        // Check for common words (brand, type, etc.)
        const currentWords = currentProductName.split(' ');
        const candidateWords = candidateProductName.split(' ');
        
        const commonWords = currentWords.filter(word => 
          word.length > 3 && candidateWords.includes(word)
        );
        
        // If they share significant words, they're related
        if (commonWords.length >= 1) return true;
        
        // 2. Similar price range (within 30% of current product price)
        const priceDiff = Math.abs(p.price - this.product!.price);
        const priceThreshold = this.product!.price * 0.3;
        if (priceDiff <= priceThreshold) return true;
        
        return false;
      });

      // Sort by relevance (products with more common words first)
      related.sort((a, b) => {
        const aCommonWords = this.countCommonWords(this.product!.name, a.name);
        const bCommonWords = this.countCommonWords(this.product!.name, b.name);
        return bCommonWords - aCommonWords;
      });

      this.relatedProducts = related.slice(0, 6); // Limit to 6 products
    } catch (error) {
      console.error('Error loading related products:', error);
      this.relatedProducts = [];
    }
  }

  private countCommonWords(productName1: string, productName2: string): number {
    const words1 = productName1.toLowerCase().split(' ').filter(w => w.length > 3);
    const words2 = productName2.toLowerCase().split(' ').filter(w => w.length > 3);
    return words1.filter(word => words2.includes(word)).length;
  }

  ngOnDestroy(): void {
    this.qpSub?.unsubscribe();
    this.paramSub?.unsubscribe();
  }
}
