import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  ViewEncapsulation,
  ElementRef,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { GenLightboxVanillaComponent } from '../../generic/gen-lightbox-vanilla/gen-lightbox-vanilla.component';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Maximize,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
} from 'lucide-angular';

@Component({
  selector: 'app-fancy-carousel',
  standalone: true,
  imports: [CommonModule, GenLightboxVanillaComponent, LucideAngularModule],
  templateUrl: './fancy-carousel.component.html',
  styleUrls: ['./fancy-carousel.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ChevronLeft,
        ChevronRight,
        Play,
        Maximize
      })
    }
  ]
})
export class FancyCarouselComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() images: { src: string; thumb: string; type?: 'image' | 'video'; poster?: string }[] = [];
  @Input() aspectRatio: string = '3/4';
  @Input() objectPosition: 'object-center' | 'object-top' = 'object-top';
  
  currentSlideIndex: number = 0;
  isComponentReady: boolean = false; 
  
  lightboxOpen = false;
  lightboxItems: MediaItem[] = [];
  
  private isViewInitialized = false;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
  private resizeListener: ((e: UIEvent) => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private setupTimeout: any = null;
  private isDesktop = false;
  private isInitialized = false;
  
  constructor(
    private host: ElementRef, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isDesktop = this.getIsDesktop();
  }
  
  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    requestAnimationFrame(() => {
      this.initializeComponent();
    });
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && !changes['images'].firstChange && this.isViewInitialized) {
      this.isComponentReady = false; 
      this.reinitializeComponent();
    }
  }
  
  ngOnDestroy(): void {
    this.cleanup();
  }
  
  private initializeComponent(): void {
    if (!this.images.length || this.isInitialized) {
      return;
    }
    
    this.isInitialized = true;
    this.setupResizeObserver();
    this.mapImagesToLightbox();
    
    setTimeout(() => {
      this.isComponentReady = true;
      this.cdr.detectChanges();
    }, 100);
  }
  
  private reinitializeComponent(): void {
    this.isInitialized = false;
    this.cleanup();
    
    requestAnimationFrame(() => {
      if (this.isViewInitialized) {
        this.initializeComponent();
      }
    });
  }

  private mapImagesToLightbox(): void {
    this.lightboxItems = this.images.map(img => ({
      url: img.src,
      type: img.type || (this.isVideo(img.src) ? 'video' : 'image'),
      poster: img.poster || img.thumb
    }));
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    // Extraer la extensión del archivo de la URL
    const extension = url.split(/[#?]/)[0].split('.').pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    return !!extension && videoExtensions.includes(extension);
  }

  private getIsDesktop(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    
    const windowWidth = window.innerWidth;
    const actualViewportWidth = document.documentElement.clientWidth;
    const isZoomed = Math.abs(windowWidth - actualViewportWidth) > 50;
    
    return isZoomed ? actualViewportWidth >= 768 : window.matchMedia('(min-width: 768px)').matches;
  }
  
  private setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const newIsDesktop = this.getIsDesktop();
        
        if (newIsDesktop !== this.isDesktop) {
          this.isDesktop = newIsDesktop;
          this.cdr.detectChanges();
        }
      });
      
      const container = this.host.nativeElement.querySelector('.product-container');
      if (container) {
        this.resizeObserver.observe(container);
        if (typeof document !== 'undefined' && document.documentElement) {
          this.resizeObserver.observe(document.documentElement);
        }
      }
    } else {
      this.setupMediaQueryListener();
    }
  }
  
  private setupMediaQueryListener(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const mediaQueries = [
      window.matchMedia('(min-width: 768px)'),
      window.matchMedia('(max-width: 767px)')
    ];
    
    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      const newIsDesktop = this.getIsDesktop();
      if (newIsDesktop !== this.isDesktop) {
        this.isDesktop = newIsDesktop;
        this.cdr.detectChanges();
      }
    };

    this.resizeListener = (e: UIEvent) => {
      const newIsDesktop = this.getIsDesktop();
      if (newIsDesktop !== this.isDesktop) {
        this.isDesktop = newIsDesktop;
        this.cdr.detectChanges();
      }
    };
    
    mediaQueries.forEach(mq => {
      mq.addEventListener('change', this.mediaQueryListener!);
    });

    window.addEventListener('resize', this.resizeListener);
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.images.length;
    this.cdr.detectChanges();
  }

  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.images.length) % this.images.length;
    this.cdr.detectChanges();
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.cdr.detectChanges();
  }

  openLightbox(index: number): void {
    this.currentSlideIndex = index;
    this.lightboxOpen = true;
    this.cdr.detectChanges();
  }

  onLightboxClose(): void {
    this.lightboxOpen = false;
    this.cdr.detectChanges();
  }

  onLightboxIndexChange(index: number): void {
    this.currentSlideIndex = index;
    this.cdr.detectChanges();
  }
  
  private cleanup(): void {
    if (this.setupTimeout) {
      clearTimeout(this.setupTimeout);
      this.setupTimeout = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.mediaQueryListener) {
      const mediaQueries = [
        window.matchMedia('(min-width: 768px)'),
        window.matchMedia('(max-width: 767px)')
      ];
      
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', this.mediaQueryListener!);
      });
      
      this.mediaQueryListener = null;
    }

    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
  }
  
  isThumbActive(index: number): boolean {
    return this.currentSlideIndex === index;
  }
}