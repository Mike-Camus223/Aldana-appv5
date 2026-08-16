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
  PLATFORM_ID,
  ChangeDetectionStrategy
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

  @ViewChild('lightboxRoot') lightboxRoot!: ElementRef<HTMLElement>;
  @ViewChildren('slideRef') slideRefs!: QueryList<ElementRef<HTMLElement>>;

  activeIndex = 0;
  zoomed = false;
  isDragging = false;

  private isClosing = false;
  private isAnimating = false;
  private _dragMoved = false;

  // Posición actual acumulada (en coordenadas post-zoom)
  private _tx = 0;
  private _ty = 0;


  // Drag
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragOriginX = 0;
  private _dragOriginY = 0;

  // Zoom point
  private _zoomPointX = 0.5;
  private _zoomPointY = 0.5;

  // Video
  videoPaused = false;
  showVideoOverlay = false;
  videoOverlayIcon: 'play' | 'pause' = 'pause';
  private videoOverlayTimeout?: ReturnType<typeof setTimeout>;


  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.appendChild(document.body, this.el.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const openChanged = changes['isOpen']?.currentValue === true && changes['isOpen']?.previousValue === false;

    if (openChanged) {
      this.activeIndex = this.clampIndex(this.startIndex);
      this.lockScroll();
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

  private get zoomScale(): number {
    if (!isPlatformBrowser(this.platformId)) return 3;

    return window.innerWidth >= 1024 ? 3 : 2;
  }



  // ─── Scroll lock ─────────────────────────────────────────────────────────────

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

  // ─── GSAP: fade lightbox ──────────────────────────────────────────────────────

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

  // ─── Slides ───────────────────────────────────────────────────────────────────

  private initSlides(): void {
    const slides = this.slideRefs?.toArray();
    if (!slides?.length) return;

    slides.forEach((s, i) => {
      const el = s.nativeElement;
      el.style.opacity = i === this.activeIndex ? '1' : '0';
      el.style.pointerEvents = i === this.activeIndex ? 'auto' : 'none';
      el.style.transform = 'translateX(0px)';
      el.style.zIndex = i === this.activeIndex ? '1' : '0';
    });

    // Asegurar que la imagen tiene transform-origin correcto
    setTimeout(() => {
      this.resetZoomOnCurrentImage();
    }, 50);
  }

  private resetZoomOnCurrentImage(): void {
    const imgEl = this.getActiveImgEl();
    if (imgEl) {
      gsap.set(imgEl, { scale: 1, x: 0, y: 0, clearProps: 'transform' });
      this._tx = 0;
      this._ty = 0;
      this._zoomPointX = 0.5;
      this._zoomPointY = 0.5;
    }
  }

  trackByIndex(index: number): number { return index; }

  // ─── Image Helpers ───────────────────────────────────────────────────────────

  /** Devuelve el <img> del slide activo (null si es video o no encontrado) */
  private getActiveImgEl(): HTMLImageElement | null {
    const slides = this.slideRefs?.toArray();
    if (!slides?.length) return null;
    const slideEl = slides[this.activeIndex]?.nativeElement;
    if (!slideEl) return null;
    return slideEl.querySelector('img');
  }

  // ─── Límites dinámicos ────────────────────────────────────────────────────────

  private getBounds(): { maxX: number; maxY: number } {
    const imgEl = this.getActiveImgEl();
    if (!imgEl) return { maxX: 0, maxY: 0 };

    const rect = imgEl.getBoundingClientRect();
    const scale = this.zoomScale;

    const imgW = rect.width;
    const imgH = rect.height;
    const containerW = rect.width;
    const containerH = rect.height;

    const overflowX = imgW * scale - containerW;
    const overflowY = imgH * scale - containerH;

    const maxX = overflowX > 0 ? (overflowX / 2) / scale : 0;
    const maxY = overflowY > 0 ? (overflowY / 2) / scale : 0;

    return { maxX, maxY };
  }

  // ─── Zoom ─────────────────────────────────────────────────────────────────────

  toggleZoom(event?: MouseEvent): void {
    const imgEl = this.getActiveImgEl();
    if (!imgEl) {
      console.warn('No se encontró imagen para hacer zoom');
      return;
    }

    if (!this.zoomed && event) {
      // Calcular punto de zoom basado en el clic
      const rect = imgEl.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Calcular porcentaje (0 a 1) dentro de la imagen
      this._zoomPointX = Math.max(0, Math.min(1, clickX / rect.width));
      this._zoomPointY = Math.max(0, Math.min(1, clickY / rect.height));

      // Calcular la nueva posición basada en el punto de zoom
      const { maxX, maxY } = this.getBounds();

      // Convertir el punto de zoom a coordenadas de desplazamiento
      // El centro de la imagen zoomed debe alinearse con el punto de clic
      const targetX = (this._zoomPointX - 0.5) * 2 * maxX;
      const targetY = (this._zoomPointY - 0.5) * 2 * maxY;

      this._tx = Math.max(-maxX, Math.min(maxX, targetX));
      this._ty = Math.max(-maxY, Math.min(maxY, targetY));
    }

    this.zoomed = !this.zoomed;

    if (this.zoomed) {
      // Establecer transform-origin en el punto de clic
      const percentX = this._zoomPointX * 100;
      const percentY = this._zoomPointY * 100;
      gsap.set(imgEl, { transformOrigin: `${percentX}% ${percentY}%` });

      // Aplicar zoom con la posición calculada
      gsap.killTweensOf(imgEl);
      gsap.to(imgEl, {
        scale: this.zoomScale,
        x: this._tx,
        y: this._ty,
        duration: 0.7,
        ease: "power4.out",
        overwrite: true,
        onUpdate: () => {
          // Asegurar que la posición se mantiene dentro de los límites
          const { maxX, maxY } = this.getBounds();
          if (Math.abs(this._tx) > maxX || Math.abs(this._ty) > maxY) {
            this._tx = Math.max(-maxX, Math.min(maxX, this._tx));
            this._ty = Math.max(-maxY, Math.min(maxY, this._ty));
            gsap.set(imgEl, { x: this._tx, y: this._ty });
          }
        }
      });
    } else {
      // Resetear zoom
      gsap.killTweensOf(imgEl);
      gsap.to(imgEl, {
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "power3.out",
        overwrite: true,
        onComplete: () => {
          this._tx = 0;
          this._ty = 0;
          this._zoomPointX = 0.5;
          this._zoomPointY = 0.5;
          gsap.set(imgEl, { transformOrigin: 'center center' });
        }
      });
    }
  }

  onImgClick(event: MouseEvent): void {
    if (this._dragMoved) {
      this._dragMoved = false;
      return;
    }
    this.toggleZoom(event);
  }

  resetZoom(): void {
    const imgEl = this.getActiveImgEl();
    if (!imgEl) return;

    this.zoomed = false;
    this._tx = 0;
    this._ty = 0;
    this._zoomPointX = 0.5;
    this._zoomPointY = 0.5;

    gsap.killTweensOf(imgEl);
    gsap.set(imgEl, { scale: 1, x: 0, y: 0, transformOrigin: 'center center' });
  }

  // ─── Drag ─────────────────────────────────────────────────────────────────────

  startDrag(e: MouseEvent): void {
    const imgEl = this.getActiveImgEl();
    if (!this.zoomed || !imgEl) return;

    e.preventDefault();
    this.isDragging = true;
    this._dragMoved = false;
    this._dragStartX = e.clientX;
    this._dragStartY = e.clientY;
    this._dragOriginX = this._tx;
    this._dragOriginY = this._ty;
  }

  onDrag(e: MouseEvent): void {
    if (!this.isDragging || !this.zoomed) return;
    e.preventDefault();
    this._dragMoved = true;

    const imgEl = this.getActiveImgEl();
    if (!imgEl) return;

    const scale = this.zoomScale;
    const dx = (e.clientX - this._dragStartX) / scale;
    const dy = (e.clientY - this._dragStartY) / scale;

    const { maxX, maxY } = this.getBounds();

    this._tx = Math.max(-maxX, Math.min(maxX, this._dragOriginX + dx));
    this._ty = Math.max(-maxY, Math.min(maxY, this._dragOriginY + dy));

    gsap.to(imgEl, {
      x: this._tx,
      y: this._ty,
      duration: 0.3,
      ease: "power4.out"
    });
  }

  stopDrag(): void {
    this.isDragging = false;
    setTimeout(() => (this._dragMoved = false), 0);
  }

  // ─── Wheel ────────────────────────────────────────────────────────────────────

  onWheel(e: WheelEvent): void {
    if (!this.zoomed) return;
    e.preventDefault();

    const imgEl = this.getActiveImgEl();
    if (!imgEl) return;

    const scale = this.zoomScale;
    const { maxY } = this.getBounds();

    this._ty = Math.max(-maxY, Math.min(maxY, this._ty - e.deltaY / scale));
    gsap.set(imgEl, { y: this._ty });
  }

  // ─── Video ────────────────────────────────────────────────────────────────────

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

  isVideo(item: MediaItem): boolean { return item.type === 'video'; }

  getThumb(item: MediaItem): string {
    if (item.type === 'video') {
      return item.poster && item.poster.trim() !== '' ? item.poster : item.url;
    }
    return item.url;
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  next(): void { this.animateSlide('next'); }
  prev(): void { this.animateSlide('prev'); }

  goTo(i: number): void {
    if (i === this.activeIndex) return;
    this.animateSlide(i > this.activeIndex ? 'next' : 'prev', i);
  }

  private animateSlide(dir: 'next' | 'prev', targetIndex?: number): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Reset zoom del slide actual
    this.resetZoom();

    const slides = this.slideRefs.toArray();
    const currentIdx = this.activeIndex;
    const nextIdx = targetIndex !== undefined
      ? this.clampIndex(targetIndex)
      : this.clampIndex(currentIdx + (dir === 'next' ? 1 : -1));

    if (currentIdx === nextIdx) {
      this.isAnimating = false;
      return;
    }

    const currentEl = slides[currentIdx].nativeElement;
    const nextEl = slides[nextIdx].nativeElement;

    const DIST = 1200;
    const xOut = dir === 'next' ? -DIST : DIST;
    const xIn = dir === 'next' ? DIST : -DIST;

    nextEl.style.transition = 'none';
    nextEl.style.transform = `translateX(${xIn}px)`;
    nextEl.style.opacity = '1';
    nextEl.style.zIndex = '2';

    requestAnimationFrame(() => {
      const ease = 'cubic-bezier(0.45, 0, 0.25, 1)';
      currentEl.style.transition = `transform 0.5s ${ease}`;
      nextEl.style.transition = `transform 0.5s ${ease}`;
      currentEl.style.transform = `translateX(${xOut}px)`;
      nextEl.style.transform = `translateX(0px)`;
    });

    setTimeout(() => {
      currentEl.style.opacity = '0';
      currentEl.style.transition = '';
      currentEl.style.zIndex = '0';
      nextEl.style.transition = '';
      nextEl.style.zIndex = '1';
      this.activeIndex = nextIdx;
      this.indexChange.emit(this.activeIndex);

      // Resetear el zoom en la nueva imagen
      setTimeout(() => {
        this.resetZoomOnCurrentImage();
      }, 50);

      this.zoomed = false;
      this.isDragging = false;
      this._dragMoved = false;
      this.isAnimating = false;
    }, 500);
  }

  // ─── Host Listeners ───────────────────────────────────────────────────────────

  @HostListener('document:mouseup')
  onMouseUp(): void { this.stopDrag(); }

  @HostListener('document:keydown', ['$event'])
  onKeydown(evt: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (evt.key === 'Escape') this.close();
    if (evt.key === 'ArrowRight') this.next();
    if (evt.key === 'ArrowLeft') this.prev();
  }

  // ─── Close ────────────────────────────────────────────────────────────────────

  close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.resetZoom();
    this.animateClose(() => {
      this.isClosing = false;
      this.isOpen = false;
      this.zoomed = false;
      this._tx = 0;
      this._ty = 0;
      this.isDragging = false;
      this._dragMoved = false;
      this.unlockScroll();
      this.closed.emit();
    });
  }

  private clampIndex(index: number): number {
    const len = this.items?.length ?? 0;
    return ((index % len) + len) % len;
  }
}