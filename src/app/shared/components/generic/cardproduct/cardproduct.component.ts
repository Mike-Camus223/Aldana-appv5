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
  OnDestroy
} from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../utils/models/Products-supabase.interface';
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
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoaderService } from '../../../../core/services/utils/loader.service';
import { Subject, takeUntil } from 'rxjs';

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
export class CardproductComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() product!: Product;
  @Input() selectedColor: string = '';
  @Input() displayImage: string = '';
  @Input() mobileMode: 'ismobile' | 'isdesktop' = 'ismobile';
  @Input() desktopMode: 'ismobile' | 'isdesktop' = 'isdesktop';
  @Output() colorSelected = new EventEmitter<{ productId: string; color: string }>();
  @Output() wishlistToggled = new EventEmitter<string>();
  @ViewChild('productImage', { static: false }) productImageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('cardRoot', { static: false }) cardRootRef!: ElementRef<HTMLElement>;
  selectedSize: string | null = null;
  private preventHover = false;
  isMobileView: boolean = false;
  currentImage!: string;
  hoverImage: string | null = null;
  private destroy$ = new Subject<void>();
  private fadeupTrigger?: ScrollTrigger;


  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private notificationService: NotificationService,
    private router: Router,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.updateView();
        if (this.selectedColor) {
      const selectedVariant = this.product.variants.find(
        (v) => v.color_name === this.selectedColor
      );
      this.currentImage = selectedVariant?.main_image || this.displayImage || this.product.main_image;
    } else {
      this.currentImage = this.displayImage || this.product.main_image;
    }
    
    this.setHoverImage();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }
    this.loaderService.currentLoader$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loader) => {
        if (loader) {
          this.resetFadeup();
        }
      });
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        if (enabled) {
          setTimeout(() => this.createFadeup(), 30);
        } else {
          this.resetFadeup();
        }
      });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateView();
  }

  private createFadeup(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    if (this.fadeupTrigger) {
      this.fadeupTrigger.kill(true);
      this.fadeupTrigger = undefined;
    }
    gsap.set(this.cardRootRef.nativeElement, { opacity: 0, y: 30, willChange: 'opacity, transform' });
    this.fadeupTrigger = ScrollTrigger.create({
      trigger: this.cardRootRef.nativeElement,
      start: 'top 95%',
      once: true,
      onEnter: () => {
        gsap.to(this.cardRootRef.nativeElement, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => {
            (this.cardRootRef.nativeElement as HTMLElement).style.willChange = 'auto';
          }
        });
      }
    });
  }

  private resetFadeup(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    if (this.fadeupTrigger) {
      this.fadeupTrigger.kill(true);
      this.fadeupTrigger = undefined;
    }
    gsap.killTweensOf(this.cardRootRef.nativeElement);
    gsap.set(this.cardRootRef.nativeElement, { opacity: 0, y: 30, willChange: 'opacity, transform' });
  }

  private updateView(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const isMobileScreen = window.innerWidth < 768;
    this.isMobileView = isMobileScreen
      ? this.mobileMode === 'ismobile'
      : this.desktopMode === 'ismobile';
  }

  private setHoverImage(): void {
    const variant = this.product.variants.find(
      (v) => v.color_name === this.selectedColor
    );

    if (variant?.additional_images?.length) {
      this.hoverImage = variant.additional_images[0];
    } else if (this.product.additional_images?.length) {
      this.hoverImage = this.product.additional_images[0];
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
      if (this.selectedColor) {
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
    this.destroy$.next();
    this.destroy$.complete();
    if (this.fadeupTrigger) {
      this.fadeupTrigger.kill(true);
      this.fadeupTrigger = undefined;
    }
  }
}
