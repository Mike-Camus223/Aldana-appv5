import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewEncapsulation,
  ElementRef,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { Carousel } from '@fancyapps/ui';
import { Thumbs } from '@fancyapps/ui/dist/carousel/carousel.thumbs.esm.js';
import { Fancybox } from '@fancyapps/ui';

@Component({
  selector: 'app-fancy-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fancy-carousel.component.html',
  styleUrls: ['./fancy-carousel.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FancyCarouselComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() images: { src: string; thumb: string }[] = [];
  @Input() aspectRatio: string = '3/4';
  @Input() objectPosition: 'object-center' | 'object-top' = 'object-top';
  
  currentSlideIndex: number = 0;
  isComponentReady: boolean = false; 
  
  private carouselInstance: Carousel | null = null;
  private isViewInitialized = false;
  private fancyboxInstance: any = null;
  private mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
  private resizeListener: ((e: UIEvent) => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private setupTimeout: any = null;
  private isDesktop = false;
  private isInitialized = false;
  
  constructor(private host: ElementRef, private cdr: ChangeDetectorRef) {
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
    this.setupCarouselSync();
    this.setupFancybox();
    
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

  private getIsDesktop(): boolean {
    if (typeof window === 'undefined') return true;
    
    const windowWidth = window.innerWidth;
    const actualViewportWidth = document.documentElement.clientWidth;
    const isZoomed = Math.abs(windowWidth - actualViewportWidth) > 50;
    
    return isZoomed ? actualViewportWidth >= 768 : window.matchMedia('(min-width: 768px)').matches;
  }
  
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        const newIsDesktop = this.getIsDesktop();
        
        if (newIsDesktop !== this.isDesktop) {
          this.isDesktop = newIsDesktop;
          this.debounceCarouselSetup();
        }
      });
      
      const container = this.host.nativeElement.querySelector('.product-container');
      if (container) {
        this.resizeObserver.observe(container);
        this.resizeObserver.observe(document.documentElement);
      }
    } else {
      this.setupMediaQueryListener();
    }
  }
  
  private setupMediaQueryListener(): void {
    const mediaQueries = [
      window.matchMedia('(min-width: 768px)'),
      window.matchMedia('(max-width: 767px)')
    ];
    
    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      const newIsDesktop = this.getIsDesktop();
      if (newIsDesktop !== this.isDesktop) {
        this.isDesktop = newIsDesktop;
        this.debounceCarouselSetup();
      }
    };

    this.resizeListener = (e: UIEvent) => {
      const newIsDesktop = this.getIsDesktop();
      if (newIsDesktop !== this.isDesktop) {
        this.isDesktop = newIsDesktop;
        this.debounceCarouselSetup();
      }
    };
    
    mediaQueries.forEach(mq => {
      mq.addEventListener('change', this.mediaQueryListener!);
    });

    window.addEventListener('resize', this.resizeListener);
  }
  
  private debounceCarouselSetup(): void {
    if (this.setupTimeout) {
      clearTimeout(this.setupTimeout);
    }
    
    this.setupTimeout = setTimeout(() => {
      this.setupCarouselSync();
    }, 150); 
  }
  
  private setupCarouselSync(): void {
    if (!this.isViewInitialized || !this.images.length) return;
    
    this.destroyCarousel();
    
    const carouselElement = this.host.nativeElement.querySelector('.f-carousel');
    if (!carouselElement || carouselElement.classList.contains('f-carousel--initialized')) {
      return;
    }
    
    const isDesktop = this.getIsDesktop();
    
    try {
      this.carouselInstance = new Carousel(
        carouselElement,
        {
          transition: 'slide',
          preload: 3,
          Dots: false,
          Navigation: true,
          Thumbs: {
            type: isDesktop ? 'classic' : 'modern',
            Carousel: {
              dragFree: false,
              slidesPerPage: 'auto',
              Navigation: true,
              axis: isDesktop ? 'y' : 'x',
              center: !isDesktop,
              breakpoints: {
                '(min-width: 768px)': {
                  axis: 'y',
                },
                '(max-width: 767px)': {
                  axis: 'x',
                }
              },
              on: {
                change: (carousel: any) => {
                  this.currentSlideIndex = carousel.page;
                  this.cdr.detectChanges();
                }
              }
            }
          },
          on: {
            change: (carousel: any) => {
              this.currentSlideIndex = carousel.page;
              this.cdr.detectChanges();
            },
            ready: (carousel: any) => {
              this.currentSlideIndex = carousel.page;
              this.cdr.detectChanges();
            }
          }
        },
        { Thumbs }
      );
    } catch (error) {
      console.warn('Error initializing carousel:', error);
    }
  }
  
  private destroyCarousel(): void {
    if (this.carouselInstance) {
      try {
        this.carouselInstance.destroy();
      } catch (error) {
        console.warn('Error destroying carousel:', error);
      }
      this.carouselInstance = null;
    }
    
    const carouselElements = this.host.nativeElement.querySelectorAll('.f-carousel');
    carouselElements.forEach((el: HTMLElement) => {
      el.classList.remove('f-carousel--initialized');
      const duplicates = el.querySelectorAll('.f-thumbs');
      if (duplicates.length > 1) {
        for (let i = 1; i < duplicates.length; i++) {
          duplicates[i].remove();
        }
      }
    });
  }

  private setupFancybox(): void {
    this.destroyFancybox();
    
    requestAnimationFrame(() => {
      try {
        this.fancyboxInstance = Fancybox.bind('[data-fancybox="gallery"]', {
          compact: false,
          idle: false,
          dragToClose: false,
          contentClick: () =>
            window.matchMedia('(max-width: 578px), (max-height: 578px)').matches
              ? 'toggleMax'
              : 'toggleCover',
          animated: false,
          showClass: false,
          hideClass: false,
          Hash: false,
          Thumbs: false,
          Toolbar: {
            display: {
              left: [],
              middle: [],
              right: ['close'],
            },
          },
          Carousel: {
            transition: 'fadeFast',
            preload: 3,
          },
          Images: {
            zoom: true,
            Panzoom: {
              panMode: 'mousemove',
              mouseMoveFactor: 1.1,
            },
          },
          on: {
            'Carousel.change': (fancybox: any) => {
              if (this.carouselInstance) {
                const currentIndex = fancybox.getSlide()?.index || 0;
                this.currentSlideIndex = currentIndex;
                this.cdr.detectChanges();
              }
            }
          }
        });
      } catch (error) {
        console.warn('Error initializing Fancybox:', error);
      }
    });
  }

  private destroyFancybox(): void {
    if (this.fancyboxInstance) {
      try {
        Fancybox.unbind('[data-fancybox="gallery"]');
      } catch (error) {
        console.warn('Error destroying Fancybox:', error);
      }
      this.fancyboxInstance = null;
    }
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
    
    this.destroyCarousel();
    this.destroyFancybox();
  }
  
  isThumbActive(index: number): boolean {
    return this.currentSlideIndex === index;
  }
}