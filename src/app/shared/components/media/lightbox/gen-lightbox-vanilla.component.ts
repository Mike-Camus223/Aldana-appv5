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
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MediaItem } from '../../../models/objectsGallery.model';
import gsap from 'gsap';

import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-gen-lightbox-vanilla',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './gen-lightbox-vanilla.component.html',
  styleUrls: ['./gen-lightbox-vanilla.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager})
export class GenLightboxVanillaComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @Input() isOpen = false;
  @Input() items: MediaItem[] = [];
  @Input() startIndex = 0;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  @ViewChild('lightboxRoot') lightboxRoot!: ElementRef<HTMLElement>;
  @ViewChildren('slideRef') slideRefs!: QueryList<ElementRef<HTMLElement>>;

  activeIndex = 0;
  zoomed = false;
  isDragging = false;
  isSlideDragging = false;

  private isClosing = false;
  private isAnimating = false;
  private _dragMoved = false;
  private _swipeMoved = false;
  private _rafPending = false;
  private _rafId: number | null = null;
  private _slideTimeline: gsap.core.Timeline | null = null;

  // Posición actual acumulada (en coordenadas post-zoom)
  private _tx = 0;
  private _ty = 0;
  private _pendingTx = 0;
  private _pendingTy = 0;
  private _currentBounds = { maxX: 0, maxY: 0 };

  // Zoom drag & momentum
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragOriginX = 0;
  private _dragOriginY = 0;
  private _lastDragX = 0;
  private _lastDragY = 0;
  private _lastDragTime = 0;
  private _velocityX = 0;
  private _velocityY = 0;

  // Swipe drag (unzoomed slide navigation)
  private _swipeStartX = 0;
  private _swipeStartY = 0;
  private _swipeStartTime = 0;
  private _swipeDeltaX = 0;

  // Video
  videoPaused = false;
  showVideoOverlay = false;
  videoOverlayIcon: 'play' | 'pause' = 'pause';
  private videoOverlayTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  get displayTitle(): string {
    if (this.title && this.title.trim() !== '') return this.title;
    const active = this.items[this.activeIndex];
    if (active?.alt && active.alt.trim() !== '') return active.alt;
    if (this.items[0]?.alt && this.items[0].alt.trim() !== '') return this.items[0].alt;
    return '';
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.appendChild(document.body, this.el.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const openChanged = !!changes['isOpen']?.currentValue && !changes['isOpen']?.previousValue;

    if (openChanged) {
      this.activeIndex = this.clampIndex(this.startIndex);
      this.lockScroll();
      this.cdr.markForCheck();
      setTimeout(() => {
        this.initSlides();
        this.animateOpen();
        this.cdr.markForCheck();
      }, 0);
    }

    if (!openChanged && this.isOpen && (changes['startIndex'] || changes['items'])) {
      this.activeIndex = this.clampIndex(this.startIndex);
      this.cdr.markForCheck();
      setTimeout(() => {
        this.initSlides();
        this.cdr.markForCheck();
      }, 0);
    }
  }

  ngAfterViewInit(): void {
    this.initSlides();
    if (this.slideRefs) {
      this.slideRefs.changes.subscribe(() => {
        this.initSlides();
        this.cdr.markForCheck();
      });
    }
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
    if (!isPlatformBrowser(this.platformId)) return 2.8;
    return window.innerWidth >= 1024 ? 2.8 : 2.3;
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
      { opacity: 1, duration: 0.45, ease: 'power3.out' }
    );
  }

  private animateClose(onComplete: () => void): void {
    const el = this.lightboxRoot?.nativeElement;
    if (!el) { onComplete(); return; }
    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      duration: 0.35,
      ease: 'power3.in',
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
      el.style.pointerEvents = i === this.activeIndex ? 'auto' : 'none';
      gsap.set(el, {
        opacity: i === this.activeIndex ? 1 : 0,
        x: 0,
        zIndex: i === this.activeIndex ? 1 : 0
      });
    });

    setTimeout(() => {
      this.resetZoomOnCurrentImage();
    }, 50);
  }

  private resetZoomOnCurrentImage(): void {
    const imgEl = this.getActiveImgEl();
    if (imgEl) {
      gsap.killTweensOf(imgEl);
      gsap.set(imgEl, { scale: 1, x: 0, y: 0, transformOrigin: 'center center', clearProps: 'transform' });
      this._tx = 0;
      this._ty = 0;
      this._pendingTx = 0;
      this._pendingTy = 0;
    }
  }

  trackByIndex(index: number): number { return index; }

  // ─── Image Helpers ───────────────────────────────────────────────────────────

  private getActiveImgEl(): HTMLImageElement | null {
    const slides = this.slideRefs?.toArray();
    if (!slides?.length) return null;
    const slideEl = slides[this.activeIndex]?.nativeElement;
    if (!slideEl) return null;
    return slideEl.querySelector('img');
  }

  // ─── Límites dinámicos con margen holgado (sin dejar nada inaccesible) ──────

  private getBounds(): { maxX: number; maxY: number } {
    const imgEl = this.getActiveImgEl();
    if (!imgEl) return { maxX: 0, maxY: 0 };

    const scale = this.zoomScale;
    const unscaledW = imgEl.offsetWidth || 500;
    const unscaledH = imgEl.offsetHeight || 750;

    const scaledW = unscaledW * scale;
    const scaledH = unscaledH * scale;

    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    // Margen holgado y elegante para que no se sienta ultra compacto
    const paddingX = 140;
    const paddingY = 180;

    // Cobertura total de la imagen escalada más el margen holgado
    const maxX = Math.max(paddingX, (scaledW - Math.min(unscaledW, viewW * 0.75)) / 2 + paddingX);
    const maxY = Math.max(paddingY, (scaledH - Math.min(unscaledH, viewH * 0.65)) / 2 + paddingY);

    return { maxX, maxY };
  }

  // ─── Zoom ─────────────────────────────────────────────────────────────────────

  toggleZoom(event?: MouseEvent): void {
    const imgEl = this.getActiveImgEl();
    if (!imgEl) return;

    if (this._slideTimeline && this._slideTimeline.isActive()) {
      this._slideTimeline.progress(1);
      this._slideTimeline = null;
      this.isAnimating = false;
    }

    this.zoomed = !this.zoomed;

    if (this.zoomed) {
      const { maxX, maxY } = this.getBounds();

      if (event) {
        const rect = imgEl.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const px = Math.max(0, Math.min(1, clickX / rect.width));
        const py = Math.max(0, Math.min(1, clickY / rect.height));

        const unscaledW = imgEl.offsetWidth || rect.width;
        const unscaledH = imgEl.offsetHeight || rect.height;
        const scale = this.zoomScale;

        // Desplazamiento para centrar el punto seleccionado por el usuario
        const targetX = (0.5 - px) * (unscaledW * (scale - 1));
        const targetY = (0.5 - py) * (unscaledH * (scale - 1));

        this._tx = Math.max(-maxX, Math.min(maxX, targetX));
        this._ty = Math.max(-maxY, Math.min(maxY, targetY));
      } else {
        this._tx = 0;
        this._ty = 0;
      }

      this._pendingTx = this._tx;
      this._pendingTy = this._ty;

      gsap.set(imgEl, { transformOrigin: 'center center' });
      gsap.killTweensOf(imgEl);
      gsap.to(imgEl, {
        scale: this.zoomScale,
        x: this._tx,
        y: this._ty,
        duration: 0.65,
        ease: 'power4.out'
      });
    } else {
      this._tx = 0;
      this._ty = 0;
      this._pendingTx = 0;
      this._pendingTy = 0;

      gsap.killTweensOf(imgEl);
      gsap.to(imgEl, {
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.45,
        ease: 'power4.out',
        onComplete: () => {
          gsap.set(imgEl, { transformOrigin: 'center center' });
        }
      });
    }
    this.cdr.markForCheck();
  }

  onImgClick(event: MouseEvent): void {
    if (this._dragMoved || this._swipeMoved) {
      this._dragMoved = false;
      this._swipeMoved = false;
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
    this._pendingTx = 0;
    this._pendingTy = 0;

    gsap.killTweensOf(imgEl);
    gsap.set(imgEl, { scale: 1, x: 0, y: 0, transformOrigin: 'center center' });
  }

  // ─── Pointer Drag & Swipe System ──────────────────────────────────────────────

  onPointerDown(e: MouseEvent | TouchEvent): void {
    if (!this.isOpen || this.isAnimating) return;

    const isMouse = e instanceof MouseEvent;
    if (isMouse && e.button !== 0) return;

    const clientX = isMouse ? e.clientX : e.touches[0].clientX;
    const clientY = isMouse ? e.clientY : e.touches[0].clientY;

    if (this.zoomed) {
      const imgEl = this.getActiveImgEl();
      if (imgEl) gsap.killTweensOf(imgEl);

      if (this._rafId !== null) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
        this._rafPending = false;
      }

      this.isDragging = true;
      this._dragMoved = false;
      this._dragStartX = clientX;
      this._dragStartY = clientY;
      this._lastDragX = clientX;
      this._lastDragY = clientY;
      this._lastDragTime = performance.now();
      this._velocityX = 0;
      this._velocityY = 0;
      this._dragOriginX = this._tx;
      this._dragOriginY = this._ty;
      this._currentBounds = this.getBounds();
    } else {
      this.isSlideDragging = true;
      this._swipeMoved = false;
      this._swipeStartX = clientX;
      this._swipeStartY = clientY;
      this._swipeStartTime = performance.now();
      this._swipeDeltaX = 0;
    }
  }

  onPointerMove(e: MouseEvent | TouchEvent): void {
    if (!this.isOpen) return;

    const isMouse = e instanceof MouseEvent;
    const clientX = isMouse ? e.clientX : (e.touches?.[0]?.clientX ?? this._dragStartX);
    const clientY = isMouse ? e.clientY : (e.touches?.[0]?.clientY ?? this._dragStartY);

    if (this.zoomed && this.isDragging) {
      if (e.cancelable) e.preventDefault();
      const dx = clientX - this._dragStartX;
      const dy = clientY - this._dragStartY;

      if (Math.hypot(dx, dy) > 3) {
        this._dragMoved = true;
      }

      // Track velocity with exponential smoothing for silky momentum throw
      const now = performance.now();
      const dt = Math.max(1, now - this._lastDragTime);
      const instantVx = (clientX - this._lastDragX) / dt;
      const instantVy = (clientY - this._lastDragY) / dt;
      this._velocityX = this._velocityX * 0.35 + instantVx * 0.65;
      this._velocityY = this._velocityY * 0.35 + instantVy * 0.65;
      this._lastDragX = clientX;
      this._lastDragY = clientY;
      this._lastDragTime = now;

      const targetX = this._dragOriginX + dx;
      const targetY = this._dragOriginY + dy;

      const { maxX, maxY } = this._currentBounds;
      let curX = targetX;
      let curY = targetY;

      // Resistencia elástica suave al sobrepasar los límites permitidos
      if (curX > maxX) curX = maxX + (curX - maxX) * 0.25;
      else if (curX < -maxX) curX = -maxX + (curX + maxX) * 0.25;

      if (curY > maxY) curY = maxY + (curY - maxY) * 0.25;
      else if (curY < -maxY) curY = -maxY + (curY + maxY) * 0.25;

      this._pendingTx = targetX;
      this._pendingTy = targetY;

      const imgEl = this.getActiveImgEl();
      if (imgEl && !this._rafPending) {
        this._rafPending = true;
        this._rafId = requestAnimationFrame(() => {
          gsap.set(imgEl, { x: curX, y: curY, force3D: true });
          this._rafPending = false;
          this._rafId = null;
        });
      }
    } else if (!this.zoomed && this.isSlideDragging) {
      const dx = clientX - this._swipeStartX;

      if (Math.abs(dx) > 6) {
        this._swipeMoved = true;
        this._swipeDeltaX = dx;

        const slides = this.slideRefs?.toArray() || [];
        const currentEl = slides[this.activeIndex]?.nativeElement;
        const targetIdx = this.clampIndex(this.activeIndex + (dx < 0 ? 1 : -1));
        const adjEl = slides[targetIdx]?.nativeElement;
        const w = window.innerWidth;

        if (currentEl) {
          gsap.set(currentEl, { x: dx, opacity: 1, zIndex: 1, force3D: true });
        }
        if (adjEl && targetIdx !== this.activeIndex) {
          const startAdjX = dx < 0 ? w : -w;
          gsap.set(adjEl, { x: startAdjX + dx, opacity: 1, zIndex: 2, force3D: true });
        }
      }
    }
  }

  onPointerUp(): void {
    if (this.zoomed && this.isDragging) {
      this.isDragging = false;

      if (this._rafId !== null) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
        this._rafPending = false;
      }

      const imgEl = this.getActiveImgEl();

      if (imgEl) {
        const timeSinceLastMove = performance.now() - this._lastDragTime;
        if (timeSinceLastMove > 80) {
          this._velocityX = 0;
          this._velocityY = 0;
        }

        // Empuje de inercia suave (momentum throw) como en Bo & Luca
        const momentumDurationMs = 175;
        const throwX = this._velocityX * momentumDurationMs;
        const throwY = this._velocityY * momentumDurationMs;

        const destX = this._pendingTx + throwX;
        const destY = this._pendingTy + throwY;

        const { maxX, maxY } = this.getBounds();
        this._tx = Math.max(-maxX, Math.min(maxX, destX));
        this._ty = Math.max(-maxY, Math.min(maxY, destY));

        const speed = Math.hypot(this._velocityX, this._velocityY);
        const duration = Math.min(0.95, Math.max(0.55, 0.55 + speed * 0.25));

        gsap.killTweensOf(imgEl);
        gsap.to(imgEl, {
          x: this._tx,
          y: this._ty,
          duration: duration,
          ease: 'power4.out',
          overwrite: 'auto'
        });
      }

      setTimeout(() => (this._dragMoved = false), 60);
      this.cdr.markForCheck();
    } else if (!this.zoomed && this.isSlideDragging) {
      this.isSlideDragging = false;

      if (this._swipeMoved) {
        const elapsed = performance.now() - this._swipeStartTime;
        const velocity = this._swipeDeltaX / (elapsed || 1);

        const shouldNext = this._swipeDeltaX < -50 || velocity < -0.25;
        const shouldPrev = this._swipeDeltaX > 50 || velocity > 0.25;

        if (shouldNext) {
          this.animateSlide('next', undefined, this._swipeDeltaX);
        } else if (shouldPrev) {
          this.animateSlide('prev', undefined, this._swipeDeltaX);
        } else {
          // Rebotar suavemente a la posición central si no superó el umbral
          const slides = this.slideRefs?.toArray() || [];
          const currentEl = slides[this.activeIndex]?.nativeElement;
          const targetIdx = this.clampIndex(this.activeIndex + (this._swipeDeltaX < 0 ? 1 : -1));
          const adjEl = slides[targetIdx]?.nativeElement;
          const w = window.innerWidth;

          if (currentEl) {
            gsap.to(currentEl, { x: 0, duration: 0.5, ease: 'power4.out', overwrite: 'auto' });
          }
          if (adjEl && targetIdx !== this.activeIndex) {
            gsap.to(adjEl, {
              x: this._swipeDeltaX < 0 ? w : -w,
              duration: 0.5,
              ease: 'power4.out',
              overwrite: 'auto',
              onComplete: () => {
                gsap.set(adjEl, { opacity: 0, zIndex: 0 });
              }
            });
          }
        }
        setTimeout(() => (this._swipeMoved = false), 60);
      }
      this.cdr.markForCheck();
    }
  }

  // ─── Wheel con límites holgados ───────────────────────────────────────────────

  onWheel(e: WheelEvent): void {
    if (!this.isOpen || !this.zoomed) return;
    e.preventDefault();

    const imgEl = this.getActiveImgEl();
    if (!imgEl) return;

    const { maxY } = this.getBounds();
    // Clamping con holgura para cubrir escote, falda y borde inferior con margen
    this._ty = Math.max(-maxY, Math.min(maxY, this._ty - e.deltaY * 0.85));
    this._pendingTy = this._ty;

    gsap.to(imgEl, {
      y: this._ty,
      duration: 0.35,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }

  // ─── Video ────────────────────────────────────────────────────────────────────

  toggleVideo(video: HTMLVideoElement): void {
    if (this._swipeMoved) return;

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
        this.cdr.markForCheck();
      }, 900);
      this.cdr.markForCheck();
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
    if (this._dragMoved || this._swipeMoved) {
      this._dragMoved = false;
      this._swipeMoved = false;
      return;
    }
    if (i === this.activeIndex) return;
    this.animateSlide(i > this.activeIndex ? 'next' : 'prev', i);
  }

  private animateSlide(dir: 'next' | 'prev', targetIndex?: number, fromOffset?: number): void {
    const slides = this.slideRefs?.toArray() || [];
    const currentIdx = this.activeIndex;
    const nextIdx = targetIndex !== undefined
      ? this.clampIndex(targetIndex)
      : this.clampIndex(currentIdx + (dir === 'next' ? 1 : -1));

    if (currentIdx === nextIdx && fromOffset === undefined) {
      return;
    }

    if (this._slideTimeline) {
      this._slideTimeline.kill();
      this._slideTimeline = null;
    }

    this.isAnimating = true;
    this.resetZoom();

    const currentEl = slides[currentIdx]?.nativeElement;
    const nextEl = slides[nextIdx]?.nativeElement;

    // Actualizar activeIndex de inmediato para que el ring/borde de miniaturas y contador respondan al instante
    this.activeIndex = nextIdx;
    this.indexChange.emit(this.activeIndex);
    this.cdr.markForCheck();

    if (!currentEl || !nextEl) {
      this.isAnimating = false;
      return;
    }

    const w = window.innerWidth;
    const xOut = dir === 'next' ? -w : w;
    const startInX = dir === 'next' ? w : -w;

    gsap.killTweensOf([currentEl, nextEl]);

    if (fromOffset !== undefined) {
      gsap.set(currentEl, { x: fromOffset, opacity: 1, zIndex: 1, force3D: true });
      gsap.set(nextEl, { x: startInX + fromOffset, opacity: 1, zIndex: 2, force3D: true });
    } else {
      gsap.set(currentEl, { x: 0, opacity: 1, zIndex: 1, force3D: true });
      gsap.set(nextEl, { x: startInX, opacity: 1, zIndex: 2, force3D: true });
    }

    slides.forEach((s, i) => {
      if (i !== currentIdx && i !== nextIdx) {
        gsap.set(s.nativeElement, { opacity: 0, zIndex: 0, x: 0 });
      }
    });

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(currentEl, { opacity: 0, zIndex: 0, x: 0, pointerEvents: 'none' });
        gsap.set(nextEl, { opacity: 1, zIndex: 1, x: 0, pointerEvents: 'auto' });
        if (!this.zoomed) {
          this.resetZoomOnCurrentImage();
        }
        this.isDragging = false;
        this.isSlideDragging = false;
        this._dragMoved = false;
        this._swipeMoved = false;
        this.isAnimating = false;
        this._slideTimeline = null;
        this.cdr.markForCheck();
      }
    });

    this._slideTimeline = tl;

    tl.to(currentEl, {
      x: xOut,
      duration: 0.75,
      ease: 'power4.out'
    }, 0);

    tl.to(nextEl, {
      x: 0,
      duration: 0.75,
      ease: 'power4.out'
    }, 0);
  }

  // ─── Host Listeners ───────────────────────────────────────────────────────────

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(evt: MouseEvent): void {
    if (this.isOpen && (this.isDragging || this.isSlideDragging)) {
      this.onPointerMove(evt);
    }
  }

  @HostListener('document:touchmove', ['$event'])
  onDocTouchMove(evt: TouchEvent): void {
    if (this.isOpen && (this.isDragging || this.isSlideDragging)) {
      this.onPointerMove(evt);
    }
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    if (this.isOpen && (this.isDragging || this.isSlideDragging)) {
      this.onPointerUp();
    }
  }

  @HostListener('document:touchend')
  onDocTouchEnd(): void {
    if (this.isOpen && (this.isDragging || this.isSlideDragging)) {
      this.onPointerUp();
    }
  }

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
      this.isDragging = false;
      this.isSlideDragging = false;
      this._dragMoved = false;
      this._swipeMoved = false;
      this.unlockScroll();
      this.closed.emit();
      this.cdr.markForCheck();
    });
  }

  private clampIndex(index: number): number {
    const len = this.items?.length ?? 0;
    return ((index % len) + len) % len;
  }
}