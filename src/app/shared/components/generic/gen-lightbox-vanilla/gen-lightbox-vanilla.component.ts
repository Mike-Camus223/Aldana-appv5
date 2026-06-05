import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  QueryList,
  ViewChildren,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnInit,
  OnDestroy,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import gsap from 'gsap';

import {
  ChevronLeft,
  ChevronRight,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  Pause,
  Play,
  X
} from 'lucide-angular';

@Component({
  selector: 'app-gen-lightbox-vanilla',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './gen-lightbox-vanilla.component.html',
  styleUrls: ['./gen-lightbox-vanilla.component.css'],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ChevronLeft,
        ChevronRight,
        X,
        Pause,
        Play,
      })
    }
  ]
})
export class GenLightboxVanillaComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @Input() isOpen = false;
  @Input() items: MediaItem[] = [];
  @Input() startIndex = 0;
  @Output() closed = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  // El root SIEMPRE está en el DOM — GSAP maneja opacity + visibility
  @ViewChild('lightboxRoot') lightboxRoot!: ElementRef<HTMLElement>;
  @ViewChildren('slideRef') slideRefs!: QueryList<ElementRef<HTMLElement>>;

  activeIndex = 0;
  zoomed = false;
  private isClosing = false;
  private isAnimating = false;
  isDragging = false;
  private _dragMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragOriginX = 0;
  private dragOriginY = 0;
  translateX = 0;
  translateY = 0;
  private readonly FRAME_W = 520;
  private readonly FRAME_H = 690;
  private readonly ZOOM_SCALE = 2;
  videoPaused = false;
  showVideoOverlay = false;
  videoOverlayIcon: 'play' | 'pause' = 'pause';
  private videoOverlayTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.appendChild(document.body, this.el.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const openChanged  = changes['isOpen']?.currentValue === true  && changes['isOpen']?.previousValue === false;
    const closeChanged = changes['isOpen']?.currentValue === false && changes['isOpen']?.previousValue === true;

    if (openChanged) {
      this.activeIndex = this.clampIndex(this.startIndex);
      this.lockScroll();
      // initSlides primero, luego fade — todo en el mismo frame
      setTimeout(() => {
        this.initSlides();
        this.animateOpen();
      }, 0);
    }

    if (!openChanged && this.isOpen && (changes['startIndex'] || changes['items'])) {
      this.activeIndex = this.clampIndex(this.startIndex);
      setTimeout(() => this.initSlides(), 0);
    }
  }

  ngAfterViewInit(): void {
    this.initSlides();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.unlockScroll();
      if (this.el.nativeElement.parentNode) {
        this.renderer.removeChild(this.el.nativeElement.parentNode, this.el.nativeElement);
      }
    }
  }

  // ─── Scroll lock sin layout shift ────────────────────────────────────────────

  private lockScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.style.overflow = '';
    setTimeout(() => {
      document.documentElement.style.scrollbarGutter = '';
    }, 320);
  }

  // ─── GSAP: fade completo del lightbox ────────────────────────────────────────
  // El elemento ya está en el DOM con opacity:0 / visibility:hidden
  // GSAP lo hace visible ANTES de animar opacity → cero flash

  private animateOpen(): void {
    const el = this.lightboxRoot?.nativeElement;
    if (!el) return;

    gsap.killTweensOf(el);
    gsap.set(el, { visibility: 'visible', pointerEvents: 'auto' });
    gsap.fromTo(el,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
  }

  private animateClose(onComplete: () => void): void {
    const el = this.lightboxRoot?.nativeElement;
    if (!el) { onComplete(); return; }

    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(el, { visibility: 'hidden', pointerEvents: 'none' });
        onComplete();
      }
    });
  }

  // ─── Slides — lógica 100% original ───────────────────────────────────────────

  private initSlides(): void {
    const slides = this.slideRefs?.toArray();
    if (!slides?.length) return;
    slides.forEach((s, i) => {
      const el = s.nativeElement;
      el.style.opacity      = i === this.activeIndex ? '1' : '0';
      el.style.pointerEvents = i === this.activeIndex ? 'auto' : 'none';
      el.style.transform    = 'translateX(0px)';
      el.style.zIndex       = i === this.activeIndex ? '1' : '0';
    });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private forceResetInteractionState(): void {
    this.zoomed      = false;
    this.isDragging  = false;
    this._dragMoved  = false;
    this.translateX  = 0;
    this.translateY  = 0;
  }

  // ─── Video ───────────────────────────────────────────────────────────────────

  toggleVideo(video: HTMLVideoElement): void {
    if (video.paused) {
      video.play();
      this.videoPaused = false;
      this.showVideoFeedback('play');
      return;
    }
    video.pause();
    this.videoPaused = true;
    this.showVideoFeedback('pause');
  }

  private showVideoFeedback(icon: 'play' | 'pause'): void {
    if (this.videoOverlayTimeout) clearTimeout(this.videoOverlayTimeout);
    this.showVideoOverlay = false;
    requestAnimationFrame(() => {
      this.videoOverlayIcon = icon;
      this.showVideoOverlay = true;
      this.videoOverlayTimeout = setTimeout(() => {
        this.showVideoOverlay = false;
      }, 900);
    });
  }

  isVideo(item: MediaItem): boolean {
    return item.type === 'video';
  }

  getThumb(item: MediaItem): string {
    if (item.type === 'video') {
      return item.poster && item.poster.trim() !== '' ? item.poster : item.url;
    }
    return item.url;
  }

  // ─── Zoom & Drag ─────────────────────────────────────────────────────────────

  getImgTransform(): string {
    if (!this.zoomed) return 'scale(1)';
    return `scale(${this.ZOOM_SCALE}) translate(${this.translateX}px, ${this.translateY}px)`;
  }

  toggleZoom(): void {
    this.zoomed = !this.zoomed;
    if (!this.zoomed) this.resetDrag();
  }

  onImgClick(): void {
    if (this._dragMoved) return;
    this.toggleZoom();
  }

  startDrag(e: MouseEvent): void {
    if (!this.zoomed) return;
    e.preventDefault();
    this.isDragging  = true;
    this._dragMoved  = false;
    this.dragStartX  = e.clientX;
    this.dragStartY  = e.clientY;
    this.dragOriginX = this.translateX;
    this.dragOriginY = this.translateY;
  }

  onDrag(e: MouseEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();
    this._dragMoved = true;
    const dx   = (e.clientX - this.dragStartX) / this.ZOOM_SCALE;
    const dy   = (e.clientY - this.dragStartY) / this.ZOOM_SCALE;
    const maxX = (this.FRAME_W * (this.ZOOM_SCALE - 1)) / (2 * this.ZOOM_SCALE);
    const maxY = (this.FRAME_H * (this.ZOOM_SCALE - 1)) / (2 * this.ZOOM_SCALE);
    this.translateX = Math.max(-maxX, Math.min(maxX, this.dragOriginX + dx));
    this.translateY = Math.max(-maxY, Math.min(maxY, this.dragOriginY + dy));
  }

  stopDrag(): void {
    this.isDragging = false;
    setTimeout(() => (this._dragMoved = false), 0);
  }

  onWheel(e: WheelEvent): void {
    if (!this.zoomed) return;
    e.preventDefault();
    const maxY = (this.FRAME_H * (this.ZOOM_SCALE - 1)) / (2 * this.ZOOM_SCALE);
    this.translateY = Math.max(-maxY, Math.min(maxY, this.translateY - e.deltaY / this.ZOOM_SCALE));
  }

  resetDrag(): void {
    this.translateX  = 0;
    this.translateY  = 0;
    this.isDragging  = false;
    this._dragMoved  = false;
  }

  resetZoom(): void {
    this.zoomed = false;
    this.resetDrag();
  }

  // ─── Navigation — animación de slides intacta ─────────────────────────────────

  next(): void { this.animateSlide('next'); }
  prev(): void { this.animateSlide('prev'); }

  goTo(i: number): void {
    if (i === this.activeIndex) return;
    this.animateSlide(i > this.activeIndex ? 'next' : 'prev', i);
  }

  private animateSlide(dir: 'next' | 'prev', targetIndex?: number): void {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.resetZoom();

    const slides     = this.slideRefs.toArray();
    const currentIdx = this.activeIndex;
    const nextIdx    = targetIndex !== undefined
      ? this.clampIndex(targetIndex)
      : this.clampIndex(currentIdx + (dir === 'next' ? 1 : -1));

    if (currentIdx === nextIdx) { this.isAnimating = false; return; }

    const currentEl = slides[currentIdx].nativeElement;
    const nextEl    = slides[nextIdx].nativeElement;

    const DIST = 1200;
    const xOut = dir === 'next' ? -DIST :  DIST;
    const xIn  = dir === 'next' ?  DIST : -DIST;

    nextEl.style.transition = 'none';
    nextEl.style.transform  = `translateX(${xIn}px)`;
    nextEl.style.opacity    = '1';
    nextEl.style.zIndex     = '2';

    requestAnimationFrame(() => {
      const ease = 'cubic-bezier(0.45, 0, 0.25, 1)';
      currentEl.style.transition = `transform 0.5s ${ease}`;
      nextEl.style.transition    = `transform 0.5s ${ease}`;
      currentEl.style.transform  = `translateX(${xOut}px)`;
      nextEl.style.transform     = `translateX(0px)`;
    });

    setTimeout(() => {
      currentEl.style.opacity    = '0';
      currentEl.style.transition = '';
      currentEl.style.zIndex     = '0';
      nextEl.style.transition    = '';
      nextEl.style.zIndex        = '1';
      this.activeIndex = nextIdx;
      this.indexChange.emit(this.activeIndex);
      this.forceResetInteractionState();
      this.isAnimating = false;
    }, 500);
  }

  // ─── Host Listeners ──────────────────────────────────────────────────────────

  @HostListener('document:mouseup')
  onMouseUp(): void { this.stopDrag(); }

  @HostListener('document:keydown', ['$event'])
  onKeydown(evt: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (evt.key === 'Escape')     this.close();
    if (evt.key === 'ArrowRight') this.next();
    if (evt.key === 'ArrowLeft')  this.prev();
  }

  // ─── Close ───────────────────────────────────────────────────────────────────

  close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.animateClose(() => {
      this.isClosing = false;
      this.isOpen    = false;
      this.zoomed    = false;
      this.resetDrag();
      this.unlockScroll();
      this.closed.emit();
    });
  }

  private clampIndex(index: number): number {
    const len = this.items?.length ?? 0;
    return ((index % len) + len) % len;
  }
}