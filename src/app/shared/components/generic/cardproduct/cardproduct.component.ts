import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
  Inject,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Product, ProductVariant, MediaItemJSONB } from '../../../utils/models/Products-supabase.interface';
import { ProductUtils } from '../../../utils/dataEx/products-utils';
import {
  Heart,
  HeartPlus,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider
} from 'lucide-angular';
import { MoveupFadeDirective } from '../../../utils/directives/moveup-fade.directive';
import { PanimationcardDirective } from '../../../utils/directives/panimationcard.directive';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-cardproduct',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    MoveupFadeDirective,
    PanimationcardDirective,
    NgOptimizedImage
  ],
  templateUrl: './cardproduct.component.html',
  styleUrls: ['./cardproduct.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Heart,
        HeartPlus
      })
    }
  ]
})
export class CardproductComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() product!: Product;
  @Input() selectedColor: string = '';
  @Input() displayImage: string = '';
  @Input() mobileMode: 'ismobile' | 'isdesktop' = 'ismobile';
  @Input() desktopMode: 'ismobile' | 'isdesktop' = 'isdesktop';
  @Input() canAnimate: boolean = true;

  @Output() colorSelected = new EventEmitter<{ productId: string; color: string }>();
  @Output() wishlistToggled = new EventEmitter<string>();
  @ViewChild('productImage', { static: false }) productImageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('cardRoot', { static: false }) cardRootRef!: ElementRef<HTMLElement>;
  @ViewChild('mobileImage', { static: false }) mobileImageRef!: ElementRef<HTMLImageElement>;
  selectedSize: string | null = null;
  private preventHover = false;
  isMobileView: boolean = false;
  currentImage!: string;
  hoverImage: string | null = null;
  private hasAnimated: boolean = false;

  // Flag to toggle color-specific variant images on cards
  enableColorImageChange = false;

  get cardQueryParams(): any {
    const params: any = {};
    if (this.selectedColor) {
      params.color = this.selectedColor;
    }
    if (this.selectedSize && !this.product.isBridal) {
      params.talla = this.selectedSize;
    }
    return params;
  }

  get isNewProduct(): boolean {
    if (!this.product.created_at) return false;
    const createdAt = new Date(this.product.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }

  get isBridalProduct(): boolean {
    return Boolean(
      this.product?.isBridal || 
      this.product?.source_module === 'bridal' || 
      !this.product?.price
    );
  }

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private notificationService: NotificationService,
    private router: Router,
    private hostRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.setupProductData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] || changes['selectedColor'] || changes['displayImage']) {
      this.setupProductData();
    }
    if (changes['canAnimate'] && this.canAnimate && !this.hasAnimated) {
      if (isPlatformBrowser(this.platformId)) {
        this.playEntryAnimation();
      }
    }
  }

  private setupProductData(): void {
    this.updateView();
    if (!this.product) return;

    if (!this.selectedColor && this.product.variants && this.product.variants.length > 0) {
      const baseVariant = this.product.variants.find(v => v.isBase);
      if (baseVariant) {
        this.selectedColor = baseVariant.color_name;
      } else {
        this.selectedColor = this.product.variants[0].color_name;
      }
    }
    
    if (this.selectedColor && this.enableColorImageChange) {
      const selectedVariant = this.product.variants?.find(
        (v) => v.color_name === this.selectedColor
      );
      this.currentImage = selectedVariant?.main_image || this.displayImage || this.product.main_image;
    } else {
      this.currentImage = this.displayImage || this.product.main_image;
    }
    
    this.setHoverImage();
  }

  ngAfterViewInit(): void {
    this.updateView();
    if (isPlatformBrowser(this.platformId)) {
      if (this.canAnimate && !this.hasAnimated) {
        this.playEntryAnimation();
      } else if (!this.canAnimate && this.cardRootRef?.nativeElement) {
        gsap.set(this.cardRootRef.nativeElement, { opacity: 0, y: 30 });
      }
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateView();
  }

  private playEntryAnimation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    this.hasAnimated = true;
    const cardEl = this.cardRootRef.nativeElement;
    const imgEl = this.getImageEl();
    const delay = this.computeStaggerDelay();

    gsap.killTweensOf(cardEl);
    gsap.fromTo(cardEl,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power2.out',
        delay: delay,
        clearProps: 'willChange'
      }
    );

    if (imgEl) {
      gsap.killTweensOf(imgEl);
      gsap.fromTo(imgEl,
        { scale: 1.06 },
        {
          scale: 1.0,
          duration: 0.75,
          ease: 'power2.out',
          delay: delay,
          clearProps: 'willChange'
        }
      );
    }
  }

  private computeStaggerDelay(): number {
    try {
      const host = this.hostRef.nativeElement;
      const parent = host.parentElement;
      if (!parent) return 0;
      const children = Array.from(parent.children);
      const index = children.indexOf(host);
      return Math.max(0, index) * 0.08;
    } catch {
      return 0;
    }
  }

  private getImageEl(): HTMLElement | null {
    return this.productImageRef?.nativeElement || this.mobileImageRef?.nativeElement || null;
  }

  private updateView(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const isMobileScreen = window.innerWidth < 768;
    this.isMobileView = isMobileScreen
      ? this.mobileMode === 'ismobile'
      : this.desktopMode === 'ismobile';
  }

  private setHoverImage(): void {
    if (this.selectedColor && this.enableColorImageChange) {
      const variant = this.product.variants?.find(
        (v) => v.color_name === this.selectedColor
      );

      const variantProductMedia = variant ? ProductUtils.getMediaByUse(variant.media, 'product') : [];
      if (variantProductMedia.length > 0) {
        this.hoverImage = variantProductMedia[0].url;
        return;
      }
    }
    
    const productMedia = ProductUtils.getMediaByUse(this.product.media, 'product');
    if (productMedia.length > 0) {
      this.hoverImage = productMedia[0].url;
    } else {
      this.hoverImage = null;
    }
  }

  onMouseEnter(event?: MouseEvent): void {
    if (
      !this.isMobileView &&
      this.hoverImage &&
      !this.preventHover &&
      event?.target === this.productImageRef?.nativeElement
    ) {
      this.currentImage = this.hoverImage;
    }
  }

  onMouseLeave(): void {
    if (!this.isMobileView) {
      if (this.selectedColor && this.enableColorImageChange) {
        const selectedVariant = this.product.variants?.find(
          (v) => v.color_name === this.selectedColor
        );
        this.currentImage = selectedVariant?.main_image || this.displayImage || this.product.main_image;
      } else {
        this.currentImage = this.displayImage || this.product.main_image;
      }
    }
  }

  async toggleWishlist(event: Event) {
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.notificationService.showWarn(
        'Necesitas iniciar sesión',
        'Antes de agregar un producto a Favoritos'
      );
      return;
    }

    // Actualización optimista: Cambiar estado visualmente primero
    const previousState = this.product.wishlisted;
    this.product.wishlisted = !previousState;

    try {
      const result = await this.favoritesService.toggleFavorite(this.product.id);
      if (result.success) {
        this.notificationService.showSuccess(result.message, '');
      } else {
        this.product.wishlisted = previousState;
        this.notificationService.showError(
          'Error',
          result.message || 'Ocurrió un error al actualizar favoritos'
        );
      }

    } catch (error) {
      this.product.wishlisted = previousState;
      this.notificationService.showError(
        'Error Inesperado',
        'Ocurrió un error al actualizar favoritos'
      );
    }
  }

  selectColor(color: string): void {
    if (this.selectedColor === color) return;
    this.selectedColor = color;
    this.colorSelected.emit({ productId: this.product.id, color });
    
    if (this.enableColorImageChange) {
      const selectedVariant = this.product.variants?.find(
        (v) => v.color_name === color
      );
      if (selectedVariant?.main_image) {
        this.currentImage = selectedVariant.main_image;
      } else {
        this.currentImage = this.displayImage || this.product.main_image;
      }
      this.setHoverImage();
      this.preventHover = true;
      this.preloadImage(this.hoverImage || '');
      this.preloadImage(this.currentImage);
      setTimeout(() => {
        this.preventHover = false;
      }, 200);
    }
  }

  selectSize(size: string) {
    this.selectedSize = size;
    const queryParams: any = { talla: size };
    if (this.selectedColor) {
      queryParams.color = this.selectedColor;
    }
    this.router.navigate(['/producto', this.product.slug], { queryParams });
  }

  private preloadImage(src: string): void {
    if (!src) return;
    const img = new Image();
    img.src = src;
  }

  ngOnDestroy(): void {
    if (this.cardRootRef?.nativeElement) {
      gsap.killTweensOf(this.cardRootRef.nativeElement);
    }
    const imgEl = this.getImageEl();
    if (imgEl) {
      gsap.killTweensOf(imgEl);
    }
  }
}
