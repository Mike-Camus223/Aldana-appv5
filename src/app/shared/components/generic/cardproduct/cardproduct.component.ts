import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Product } from '../../../utils/models/Products-supabase.interface';
import {
  Heart,
  HeartPlus,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider
} from 'lucide-angular';
import { FadeDirective } from '../../../utils/directives/fade.directive';
import { ZoomoutDirective } from '../../../utils/directives/zoomout.directive';
import { MoveupFadeDirective } from '../../../utils/directives/moveup-fade.directive';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-cardproduct',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    FadeDirective,
    ZoomoutDirective,
    MoveupFadeDirective,
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
export class CardproductComponent implements OnInit {
  @Input() product!: Product;
  @Input() selectedColor: string = '';
  @Input() displayImage: string = '';
  @Input() mobileMode: 'ismobile' | 'isdesktop' = 'ismobile';
  @Input() desktopMode: 'ismobile' | 'isdesktop' = 'isdesktop';
  @Output() colorSelected = new EventEmitter<{ productId: string; color: string }>();
  @Output() wishlistToggled = new EventEmitter<string>();
  @ViewChild('productImage', { static: false }) productImageRef!: ElementRef<HTMLImageElement>;

  private preventHover = false;
  isMobileView: boolean = false;
  currentImage!: string;
  hoverImage: string | null = null;


  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private notificationService: NotificationService
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

  @HostListener('window:resize')
  onResize(): void {
    this.updateView();
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

  private preloadImage(src: string): void {
    if (!src) return;
    const img = new Image();
    img.src = src;
  }
}
