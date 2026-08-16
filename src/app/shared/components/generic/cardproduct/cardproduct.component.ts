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
import { LoaderService } from '../../../../core/services/utils/loader.service';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';

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
  changeDetection: ChangeDetectionStrategy.Eager,
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
  private readonly fadeupDuration = 0.55;
  private readonly zoomDuration = 0.75;
  private readonly staggerBase = 0.08;
  private loaderSubscription?: Subscription;

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

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private notificationService: NotificationService,
    private router: Router,
    private hostRef: ElementRef<HTMLElement>,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.updateView();
    
    // If no selected color is provided, select the first available color or base color
    if (!this.selectedColor && this.product.variants && this.product.variants.length > 0) {
      // Try to find a base color first
      const baseVariant = this.product.variants.find(v => v.isBase);
      if (baseVariant) {
        this.selectedColor = baseVariant.color_name;
      } else {
        // If no base color, select the first variant
        this.selectedColor = this.product.variants[0].color_name;
      }
    }
    
    if (this.selectedColor && this.enableColorImageChange) {
      const selectedVariant = this.product.variants.find(
        (v) => v.color_name === this.selectedColor
      );
      this.currentImage = selectedVariant?.main_image || this.displayImage || this.product.main_image;
    } else {
      this.currentImage = this.displayImage || this.product.main_image;
    }
    
    this.setHoverImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && !changes['product'].firstChange) {
      if (isPlatformBrowser(this.platformId)) {
        this.waitForLoaderThenAnimate();
      }
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    this.waitForLoaderThenAnimate();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateView();
  }

  private waitForLoaderThenAnimate(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Set initial invisible state immediately to avoid layout flicker
    this.setInitialState();

    // Subscribe to loader animations state
    this.loaderSubscription = this.loaderService.animationsEnabled$.subscribe(async (enabled: boolean) => {
      if (enabled) {
        // Wait for image content to be ready before playing animation
        await this.waitForImageToLoad();
        
        this.playEntryAnimation();
        // Unsubscribe immediately so it only runs once per mount
        this.loaderSubscription?.unsubscribe();
        this.loaderSubscription = undefined;
      }
    });
  }

  private async waitForImageToLoad(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Wait a brief frame for the img DOM binding if not immediate
    let imgEl = this.getImageEl();
    if (!imgEl) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      imgEl = this.getImageEl();
    }
    
    if (imgEl instanceof HTMLImageElement) {
      await new Promise<void>((resolve) => {
        if (imgEl.complete && imgEl.naturalWidth > 0) {
          resolve();
        } else {
          imgEl.addEventListener('load', () => resolve(), { once: true });
          imgEl.addEventListener('error', () => resolve(), { once: true });
          // Safety timeout of 1.5 seconds to handle slow networks
          setTimeout(() => resolve(), 1500);
        }
      });
    }
  }

  private setInitialState(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    gsap.killTweensOf(this.cardRootRef.nativeElement);
    gsap.set(this.cardRootRef.nativeElement, { opacity: 0, y: 30, willChange: 'opacity, transform' });
    const imgEl = this.getImageEl();
    if (imgEl) {
      gsap.killTweensOf(imgEl);
      gsap.set(imgEl, { scale: 1.06, willChange: 'transform' });
    }
  }

  private playEntryAnimation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    gsap.killTweensOf(this.cardRootRef.nativeElement);
    gsap.set(this.cardRootRef.nativeElement, { opacity: 0, y: 30, willChange: 'opacity, transform' });
    const imgEl = this.getImageEl();
    if (imgEl) {
      gsap.killTweensOf(imgEl);
      gsap.set(imgEl, { scale: 1.06, willChange: 'transform' });
    }
    const delay = this.computeStaggerDelay();
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, delay });
    tl.to(this.cardRootRef.nativeElement, {
      opacity: 1,
      y: 0,
      duration: this.fadeupDuration,
      onComplete: () => {
        (this.cardRootRef.nativeElement as HTMLElement).style.willChange = 'auto';
      }
    }, 0);
    if (imgEl) {
      tl.to(imgEl, {
        scale: 1.0,
        duration: this.zoomDuration
      }, 0);
    }
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
      const variant = this.product.variants.find(
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
        const selectedVariant = this.product.variants.find(
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
      this.notificationService.showSuccess(result.message, '');

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
      const selectedVariant = this.product.variants.find(
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
  
  private getImageEl(): HTMLElement | null {
    const el = this.productImageRef?.nativeElement || this.mobileImageRef?.nativeElement || null;
    return el;
  }
  
  private computeStaggerDelay(): number {
    try {
      const parent = this.hostRef.nativeElement.parentElement;
      if (!parent) return 0;
      const children = Array.from(parent.children);
      const index = children.indexOf(this.hostRef.nativeElement);
      const style = window.getComputedStyle(parent);
      const colsDef = style.gridTemplateColumns || '';
      const cols = colsDef.split(' ').filter(s => s && s !== 'none').length || 1;
      const colIndex = cols > 0 ? (index % cols) : index;
      return colIndex * this.staggerBase;
    } catch {
      return 0;
    }
  }

  ngOnDestroy(): void {
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
    if (this.cardRootRef?.nativeElement) {
      gsap.killTweensOf(this.cardRootRef.nativeElement);
    }
    const imgEl = this.getImageEl();
    if (imgEl) {
      gsap.killTweensOf(imgEl);
    }
  }
}
