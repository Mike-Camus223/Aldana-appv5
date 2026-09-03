import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID,
  HostListener,
  AfterViewInit
} from '@angular/core';
import { CardInitAnimationDirective } from '../../../directives/animations/card-init-animation.directive';

@Component({
  selector: 'app-carousel-images-genericv2',
  standalone: true,
  imports: [CommonModule, CardInitAnimationDirective],
  templateUrl: './carousel-images-genericv2.component.html',
  styleUrls: ['./carousel-images-genericv2.component.css']
})
export class CarouselImagesGenericv2Component implements AfterViewInit {
  @ViewChild('sliderRef', { static: false }) sliderRef!: ElementRef<HTMLElement>;

  @Input() images: any[] = [];
  @Input() aspectRatio: string = '4 / 5';
  @Input() hoverOverlay: boolean = true;
  @Input() hoverIconClass: string = 'fab fa-instagram';

  @Input() slidesPerView: number = 3;
  @Input() spacing: number = 15;
  @Input() loop: boolean = true;

  @Input() breakpoints: Record<string, any> = {
    '(min-width: 640px)': { slides: { perView: 3, spacing: 15 } },
    '(min-width: 768px)': { slides: { perView: 4, spacing: 15 } },
    '(min-width: 1024px)': { slides: { perView: 5, spacing: 15 } }
  };

  @Output() imageClick = new EventEmitter<any>();

  currentPerView: number = 3;
  currentSpacing: number = 15;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateResponsiveConfig();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateResponsiveConfig();
    }
  }

  private updateResponsiveConfig(): void {
    const width = window.innerWidth;
    if (width >= 1024) {
      this.currentPerView = this.breakpoints['(min-width: 1024px)']?.slides?.perView ?? 5;
      this.currentSpacing = this.breakpoints['(min-width: 1024px)']?.slides?.spacing ?? this.spacing;
    } else if (width >= 768) {
      this.currentPerView = this.breakpoints['(min-width: 768px)']?.slides?.perView ?? 4;
      this.currentSpacing = this.breakpoints['(min-width: 768px)']?.slides?.spacing ?? this.spacing;
    } else if (width >= 640) {
      this.currentPerView = this.breakpoints['(min-width: 640px)']?.slides?.perView ?? 3;
      this.currentSpacing = this.breakpoints['(min-width: 640px)']?.slides?.spacing ?? this.spacing;
    } else {
      this.currentPerView = this.slidesPerView;
      this.currentSpacing = this.spacing;
    }
  }

  getSlideWidth(): string {
    return `calc((100% - ${(this.currentPerView - 1) * this.currentSpacing}px) / ${this.currentPerView})`;
  }

  getPaddingBottom(): string {
    const [w, h] = this.aspectRatio.split('/').map(Number);
    return `${(h / w) * 100}%`;
  }

  scrollNext(): void {
    if (this.sliderRef?.nativeElement) {
      const container = this.sliderRef.nativeElement;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  scrollPrev(): void {
    if (this.sliderRef?.nativeElement) {
      const container = this.sliderRef.nativeElement;
      const scrollAmount = container.clientWidth * 0.8;
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }
}