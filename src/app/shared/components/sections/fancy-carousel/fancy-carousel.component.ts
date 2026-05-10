import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Input,
  ViewEncapsulation,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { GenLightboxVanillaComponent } from '../../generic/gen-lightbox-vanilla/gen-lightbox-vanilla.component';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
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
      useValue: new LucideIconProvider({ ChevronLeft, ChevronRight, Play, Pause, Maximize }),
    },
  ],
})
export class FancyCarouselComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() images: { src: string; thumb: string; type?: 'image' | 'video'; poster?: string }[] = [];
  @ViewChild('thumbContainer') thumbContainer!: ElementRef<HTMLElement>;

  currentSlideIndex = 0;
  isComponentReady = false;
  lightboxOpen = false;
  lightboxItems: MediaItem[] = [];
  isDesktop = false;

  get currentPageIndex(): number {
    return Math.floor(this.currentSlideIndex / 4);
  }

  private isViewInitialized = false;
  private isInitialized = false;

  // ─── Drag state (del código antiguo que funciona) ─────────────────────────────
  private readonly DRAG_THRESHOLD = 5;
  private readonly FRICTION = 0.92;
  private readonly MIN_VELOCITY = 0.5;

  // Mouse drag
  private mouseDown = false;
  private mouseMoved = false;
  private mouseStartX = 0;
  private mouseScrollLeft = 0;
  private mouseVelocity = 0;
  private mouseLastX = 0;
  private mouseLastTime = 0;

  // Touch drag
  private touchStartX = 0;
  private touchScrollLeft = 0;
  private touchVelocity = 0;
  private touchLastX = 0;
  private touchLastTime = 0;
  private touchMoved = false;

  // Inercia RAF
  private inertiaRaf: number | null = null;

  // Scroll throttle
  private scrollThrottleTimer: any = null;

  // Video overlay
  videoPaused = false;
  showVideoOverlay = false;
  videoOverlayIcon: 'play' | 'pause' = 'pause';
  private videoOverlayTimeout?: ReturnType<typeof setTimeout>;

  // Media query
  private mql?: MediaQueryList;
  private mqlListener = (e: MediaQueryListEvent) => {
    this.isDesktop = e.matches;
    this.cdr.detectChanges();
  };

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (isPlatformBrowser(this.platformId)) {
      this.mql = window.matchMedia('(min-width: 768px)');
      this.isDesktop = this.mql.matches;
      this.mql.addEventListener('change', this.mqlListener);
      this.initializeComponent();
      this.attachGlobalMouseListeners();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && !changes['images'].firstChange && this.isViewInitialized) {
      this.reinitializeComponent();
    }
  }

  ngOnDestroy(): void {
    this.cancelInertia();
    this.mql?.removeEventListener('change', this.mqlListener);
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
    }
    if (this.scrollThrottleTimer) clearTimeout(this.scrollThrottleTimer);
    if (this.videoOverlayTimeout) clearTimeout(this.videoOverlayTimeout);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────

  private initializeComponent(): void {
    if (!this.images.length || this.isInitialized) return;
    this.isInitialized = true;
    this.mapImagesToLightbox();
    setTimeout(() => {
      this.isComponentReady = true;
      this.cdr.detectChanges();
    }, 150);
  }

  private reinitializeComponent(): void {
    this.isInitialized = false;
    this.currentSlideIndex = 0;
    this.initializeComponent();
  }

  private mapImagesToLightbox(): void {
    this.lightboxItems = this.images.map(img => ({
      url: img.src,
      type: img.type || (this.isVideo(img.src) ? 'video' : 'image'),
      poster: img.poster || img.thumb,
    }));
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    const ext = url.split(/[#?]/)[0].split('.').pop()?.toLowerCase();
    return !!ext && ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext);
  }

  // ─── Video controls ───────────────────────────────────────────────────────────

  toggleVideo(video: HTMLVideoElement): void {
    if (video.paused) {
      video.play();
      this.videoPaused = false;
      this.showVideoFeedback('play');
    } else {
      video.pause();
      this.videoPaused = true;
      this.showVideoFeedback('pause');
    }
  }

  private showVideoFeedback(icon: 'play' | 'pause'): void {
    if (this.videoOverlayTimeout) clearTimeout(this.videoOverlayTimeout);
    this.showVideoOverlay = false;
    this.cdr.detectChanges();
    requestAnimationFrame(() => {
      this.videoOverlayIcon = icon;
      this.showVideoOverlay = true;
      this.cdr.detectChanges();
      this.videoOverlayTimeout = setTimeout(() => {
        this.showVideoOverlay = false;
        this.cdr.detectChanges();
      }, 900);
    });
  }

  // ─── Slide navigation ─────────────────────────────────────────────────────────

  nextSlide(): void {
    this.goToSlide((this.currentSlideIndex + 1) % this.images.length);
  }

  prevSlide(): void {
    this.goToSlide((this.currentSlideIndex - 1 + this.images.length) % this.images.length);
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.syncThumbScroll(index);
    this.cdr.detectChanges();
  }

  goToPage(pageIndex: number): void {
    const firstIndexOfPage = pageIndex * 4;
    const clamped = Math.min(firstIndexOfPage, this.images.length - 1);
    this.goToSlide(clamped);
  }

  // ─── Thumb scroll sync ────────────────────────────────────────────────────────

  private syncThumbScroll(index: number): void {
    if (!this.thumbContainer || this.isDesktop) return;
    const container = this.thumbContainer.nativeElement;
    const target = this.scrollTargetForIndex(container, index);
    this.cancelInertia();
    container.scrollTo({ left: target, behavior: 'smooth' });
  }

  private scrollTargetForIndex(container: HTMLElement, index: number): number {
    const gap = 8;
    const containerWidth = container.offsetWidth;
    const itemWidth = (containerWidth - gap * 3) / 4;
    return index * (itemWidth + gap);
  }

  private indexFromScroll(container: HTMLElement): number {
    const gap = 8;
    const containerWidth = container.offsetWidth;
    const itemWidth = (containerWidth - gap * 3) / 4;
    const raw = container.scrollLeft / (itemWidth + gap);
    return Math.max(0, Math.min(Math.round(raw), this.images.length - 1));
  }

  // ─── Scroll event ─────────────────────────────────────────────────────────────

  onThumbScroll(event: Event): void {
    if (this.isDesktop) return;
    if (this.scrollThrottleTimer) return;
    this.scrollThrottleTimer = setTimeout(() => {
      this.scrollThrottleTimer = null;
      const container = event.target as HTMLElement;
      const newIndex = this.indexFromScroll(container);
      if (newIndex !== this.currentSlideIndex) {
        this.currentSlideIndex = newIndex;
        this.cdr.detectChanges();
      }
    }, 50);
  }

  // ─── Mouse drag (del código antiguo) ─────────────────────────────────────────

  private attachGlobalMouseListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  onThumbMouseDown(event: MouseEvent): void {
    if (!this.thumbContainer) return;
    this.cancelInertia();
    const container = this.thumbContainer.nativeElement;

    this.mouseDown = true;
    this.mouseMoved = false;
    this.mouseStartX = event.clientX;
    this.mouseScrollLeft = container.scrollLeft;
    this.mouseLastX = event.clientX;
    this.mouseLastTime = performance.now();
    this.mouseVelocity = 0;

    container.style.cursor = 'grabbing';
    event.preventDefault();
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.mouseDown || !this.thumbContainer) return;
    const container = this.thumbContainer.nativeElement;
    const dx = event.clientX - this.mouseStartX;

    if (Math.abs(dx) > this.DRAG_THRESHOLD) this.mouseMoved = true;

    const now = performance.now();
    const dt = now - this.mouseLastTime || 1;
    this.mouseVelocity = ((event.clientX - this.mouseLastX) / dt) * 16.7;
    this.mouseLastX = event.clientX;
    this.mouseLastTime = now;

    container.scrollLeft = this.mouseScrollLeft - dx;
  };

  private handleMouseUp = (): void => {
    if (!this.mouseDown || !this.thumbContainer) return;
    this.mouseDown = false;
    const container = this.thumbContainer.nativeElement;
    container.style.cursor = 'grab';

    if (this.mouseMoved) {
      this.startInertia(container, -this.mouseVelocity);
    }
  };

  onThumbClick(index: number): void {
    if (this.mouseMoved || this.touchMoved) {
      this.mouseMoved = false;
      this.touchMoved = false;
      return;
    }
    this.goToSlide(index);
  }

  // ─── Touch drag (del código antiguo) ─────────────────────────────────────────

  onThumbTouchStart(event: TouchEvent): void {
    if (!this.thumbContainer) return;
    this.cancelInertia();
    const container = this.thumbContainer.nativeElement;

    this.touchStartX = event.touches[0].clientX;
    this.touchScrollLeft = container.scrollLeft;
    this.touchLastX = event.touches[0].clientX;
    this.touchLastTime = performance.now();
    this.touchVelocity = 0;
    this.touchMoved = false;
  }

  onThumbTouchMove(event: TouchEvent): void {
    if (!this.thumbContainer) return;
    const container = this.thumbContainer.nativeElement;
    const dx = event.touches[0].clientX - this.touchStartX;

    if (Math.abs(dx) > this.DRAG_THRESHOLD) this.touchMoved = true;

    const now = performance.now();
    const dt = now - this.touchLastTime || 1;
    this.touchVelocity = ((event.touches[0].clientX - this.touchLastX) / dt) * 16.7;
    this.touchLastX = event.touches[0].clientX;
    this.touchLastTime = now;

    container.scrollLeft = this.touchScrollLeft - dx;

    if (Math.abs(dx) > 10) event.preventDefault();
  }

  onThumbTouchEnd(_event: TouchEvent): void {
    if (!this.thumbContainer || !this.touchMoved) return;
    const container = this.thumbContainer.nativeElement;
    this.startInertia(container, -this.touchVelocity);
  }

  // ─── Inercia (del código antiguo) ────────────────────────────────────────────

  private startInertia(container: HTMLElement, velocity: number): void {
    this.cancelInertia();
    let vel = velocity;

    const step = () => {
      vel *= this.FRICTION;
      container.scrollLeft += vel;

      if (Math.abs(vel) > this.MIN_VELOCITY) {
        this.inertiaRaf = requestAnimationFrame(step);
      } else {
        this.snapToNearest(container);
      }
    };

    this.inertiaRaf = requestAnimationFrame(step);
  }

  private cancelInertia(): void {
    if (this.inertiaRaf !== null) {
      cancelAnimationFrame(this.inertiaRaf);
      this.inertiaRaf = null;
    }
  }

  private snapToNearest(container: HTMLElement): void {
    const nearest = this.indexFromScroll(container);
    const target = this.scrollTargetForIndex(container, nearest);
    container.scrollTo({ left: target, behavior: 'smooth' });

    if (nearest !== this.currentSlideIndex) {
      this.currentSlideIndex = nearest;
      this.cdr.detectChanges();
    }
  }

  // ─── Indicadores ──────────────────────────────────────────────────────────────

  getPages(): any[] {
    return new Array(Math.ceil(this.images.length / 4));
  }

  // ─── Lightbox (solo desktop) ──────────────────────────────────────────────────

  openLightbox(index: number): void {
    if (!this.isDesktop) return;
    this.currentSlideIndex = index;
    this.lightboxOpen = true;
  }

  onLightboxClose(): void {
    this.lightboxOpen = false;
  }

  onLightboxIndexChange(index: number): void {
    this.currentSlideIndex = index;
    this.syncThumbScroll(index);
    this.cdr.detectChanges();
  }

  isThumbActive(index: number): boolean {
    return this.currentSlideIndex === index;
  }
}