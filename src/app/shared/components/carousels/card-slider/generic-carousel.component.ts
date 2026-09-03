import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  signal,
  computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CarouselItemDirective } from '../../../directives/ui/carousel-slide.directive';
import { LucideAngularModule } from 'lucide-angular';
import { LoaderService } from '../../../../core/services/utils/loader.service';

export interface CarouselConfig {
  autoplay?: boolean;
  autoplayInterval?: number;
  loop?: boolean;
  visibleItems?: number;
  gap?: number;
  animationDuration?: number;
  /** @deprecated usar showIndicators */
  showDots?: boolean;
  /** Muestra flechas de navegación. El drag/swipe SIEMPRE está activo. */
  showArrows?: boolean;
  dragEnabled?: boolean;
  /** Muestra el adorno (cuarto círculo verde + sparkle) en esquina inferior derecha de cada card */
  ornament?: boolean;
  /** Muestra los dots indicadores debajo del carousel */
  showIndicators?: boolean;
  /** Radio de borde (px) del wrapper de cada slide para cliepear el ornamento */
  cardRadius?: number;
}

@Component({
  selector: 'app-generic-carousel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './generic-carousel.component.html', styles: [':host { display: block; }']})
export class AppGenericCarouselComponent
  implements AfterContentInit, AfterViewInit, OnDestroy {

  @ContentChildren(CarouselItemDirective) items!: QueryList<CarouselItemDirective>;
  @Input() config: CarouselConfig = {};
  @Output() slideChange = new EventEmitter<number>();
  @Output() slideClick = new EventEmitter<number>();

  @ViewChild('track') track!: ElementRef<HTMLElement>;
  @ViewChild('trackWrapper') trackWrapper!: ElementRef<HTMLElement>;
  @ViewChild('carouselRoot') carouselRoot!: ElementRef<HTMLElement>;

  currentIndex = signal(0);
  currentPage = computed(() => {
    if (this.visibleItems <= 0 || this.totalPages <= 0) return 0;
    const normalized = ((this.currentIndex() % this.totalItems) + this.totalItems) % this.totalItems;
    return Math.min(this.totalPages - 1, Math.floor(normalized / this.visibleItems));
  });

  totalItems = 0;
  totalPages = 0;
  pagesArray: number[] = [];
  itemWidth = '100%';

  clonedStart: CarouselItemDirective[] = [];
  clonedEnd: CarouselItemDirective[] = [];

  private gsap: any;
  private scrollTrigger: any = null;
  private autoplayTimer: any;
  private dragStartX = 0;
  private dragStartY = 0;
  private isDragging = false;
  /** true si el movimiento fue > 5px → suprime el click en la card */
  private wasDragged = false;
  private startTranslateX = 0;
  private currentTranslateX = 0;
  private rawIndex = 0;
  private resizeObserver?: ResizeObserver;
  private isTransitioning = false;
  private destroy$ = new Subject<void>();

  // ─── Getters de config ────────────────────────────────────────────────────

  get visibleItems(): number { return this.config.visibleItems ?? 1; }
  get gapVal(): number { return this.config.gap ?? 16; }
  get showArrowsVal(): boolean { return this.config.showArrows !== false; }
  get showIndicatorsVal(): boolean {
    if (this.config.showIndicators !== undefined) return this.config.showIndicators;
    if (this.config.showDots !== undefined) return this.config.showDots;
    return true;
  }
  get ornamentVal(): boolean { return this.config.ornament === true; }
  get loopVal(): boolean { return this.config.loop !== false; }
  get cardRadiusVal(): number { return this.config.cardRadius ?? 16; }

  /** Modo infinito: loop activado y hay más de 1 item */
  private get infiniteMode(): boolean {
    return this.loopVal && this.totalItems > 1;
  }

  /** Clones en ambos extremos para lograr loop infinito fluido y sin espacios en blanco */
  get cloneCount(): number {
    if (!this.infiniteMode) return 0;
    return Math.max(this.visibleItems * 2, this.totalItems);
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private loaderService: LoaderService
  ) { }

  // ─── Ciclo de vida ────────────────────────────────────────────────────────

  async ngAfterContentInit() {
    this.totalItems = this.items.length;
    this.buildClones();
    this.calculatePages();
    this.items.changes.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.totalItems = this.items.length;
      this.buildClones();
      this.calculatePages();
      this.cdr.markForCheck();
      setTimeout(() => {
        this.applyTranslate(this.rawIndex, false);
        this.setupScrollAnimation();
      }, 60);
    });
  }

  async ngAfterViewInit() {
    try {
      const mod = await import('gsap');
      this.gsap = mod.gsap ?? mod.default ?? mod;
    } catch {
      this.gsap = null;
    }
    this.calculateItemWidth();
    this.setupResizeObserver();
    this.rawIndex = 0;
    this.applyTranslate(0, false);
    if (this.config.autoplay) this.startAutoplay();

    // Re-configurar cuando las animaciones estén habilitadas (post-loader)
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        if (enabled) {
          setTimeout(() => this.setupScrollAnimation(), 60);
        }
      });
  }

  private async setupScrollAnimation() {
    if (!this.carouselRoot || !this.track) return;

    const allCards = Array.from(this.track.nativeElement.children) as HTMLElement[];
    if (allCards.length === 0) return;

    try {
      const gsapMod = await import('gsap');
      const gsap = gsapMod.gsap ?? gsapMod.default ?? gsapMod;
      const stMod = await import('gsap/ScrollTrigger');
      const ScrollTrigger = stMod.ScrollTrigger ?? stMod.default ?? stMod;
      gsap.registerPlugin(ScrollTrigger);

      if (this.scrollTrigger) {
        this.scrollTrigger.kill();
        this.scrollTrigger = null;
      }

      // Pre-configuración: colocar las tarjetas inicialmente invisibles (80px abajo, opacidad 0)
      allCards.forEach((c) => {
        gsap.set(c, { y: 80, opacity: 0 });
      });

      this.scrollTrigger = ScrollTrigger.create({
        trigger: this.carouselRoot.nativeElement,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          this.ngZone.run(() => {
            // Filtrar y ordenar únicamente las tarjetas visibles en pantalla de izquierda a derecha
            const visibleCards = allCards
              .filter((card) => {
                const rect = card.getBoundingClientRect();
                return rect.right > 0 && rect.left < window.innerWidth;
              })
              .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

            const targets = visibleCards.length > 0 ? visibleCards : allCards.slice(this.cloneCount, this.cloneCount + this.visibleItems);

            // Las tarjetas no visibles en pantalla inicial se dejan visibles sin transición de scroll
            allCards.forEach((c) => {
              if (!targets.includes(c)) {
                gsap.set(c, { y: 0, opacity: 1 });
              }
            });

            // Animación Fade Up en ola de izquierda a derecha ultra profesional
            gsap.to(targets, {
              y: 0,
              opacity: 1,
              duration: 1.1,
              ease: 'power3.out',
              stagger: 0.1,
              clearProps: 'y,opacity'});
          });
        }});
    } catch {
      this.initFallbackIntersectionAnimation(allCards);
    }
  }

  private initFallbackIntersectionAnimation(allCards: HTMLElement[]) {
    if (!this.gsap || !this.carouselRoot) return;

    allCards.forEach((c) => {
      this.gsap.set(c, { y: 80, opacity: 0 });
    });

    const playWave = () => {
      const visibleCards = allCards
        .filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.right > 0 && rect.left < window.innerWidth;
        })
        .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);

      const targets = visibleCards.length > 0 ? visibleCards : allCards.slice(this.cloneCount, this.cloneCount + this.visibleItems);

      allCards.forEach((c) => {
        if (!targets.includes(c)) {
          this.gsap.set(c, { y: 0, opacity: 1 });
        }
      });

      this.gsap.to(targets, {
        y: 0,
        opacity: 1,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.1,
        clearProps: 'y,opacity'});
    };

    if (typeof IntersectionObserver === 'undefined') {
      playWave();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          this.ngZone.run(() => {
            playWave();
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(this.carouselRoot.nativeElement);
  }

  ngOnDestroy() {
    this.stopAutoplay();
    this.resizeObserver?.disconnect();
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Inicialización interna ───────────────────────────────────────────────

  private buildClones() {
    const n = this.cloneCount;
    if (n === 0) { this.clonedStart = []; this.clonedEnd = []; return; }
    const arr = this.items.toArray();
    if (arr.length === 0) return;

    const endClones: CarouselItemDirective[] = [];
    while (endClones.length < n) {
      endClones.unshift(...arr);
    }
    this.clonedEnd = endClones.slice(endClones.length - n);

    const startClones: CarouselItemDirective[] = [];
    while (startClones.length < n) {
      startClones.push(...arr);
    }
    this.clonedStart = startClones.slice(0, n);
  }

  private calculatePages() {
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.visibleItems));
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i);
  }

  private calculateItemWidth() {
    if (!this.trackWrapper) return;
    const w = this.trackWrapper.nativeElement.offsetWidth;
    const gap = this.gapVal;
    const width = (w - gap * (this.visibleItems - 1)) / this.visibleItems;
    this.itemWidth = `${width}px`;
    this.cdr.markForCheck();
  }

  private setupResizeObserver() {
    if (!this.trackWrapper) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.calculateItemWidth();
        this.applyTranslate(this.rawIndex, false);
      });
    });
    this.resizeObserver.observe(this.trackWrapper.nativeElement);
  }

  // ─── Posicionamiento ──────────────────────────────────────────────────────

  private getTranslateX(index: number): number {
    if (!this.trackWrapper) return 0;
    const w = this.trackWrapper.nativeElement.offsetWidth;
    const gap = this.gapVal;
    const itemW = (w - gap * (this.visibleItems - 1)) / this.visibleItems;
    const offset = this.cloneCount;   // 0 si no hay clones
    return -((index + offset) * (itemW + gap));
  }

  private applyTranslate(index: number, animate = true) {
    if (!this.track) return;
    const x = this.getTranslateX(index);
    this.currentTranslateX = x;
    const dur = (this.config.animationDuration ?? 450) / 1000;
    if (this.gsap && animate) {
      this.isTransitioning = true;
      this.gsap.killTweensOf(this.track.nativeElement);
      this.gsap.to(this.track.nativeElement, {
        x, duration: dur, ease: 'power3.out',
        onComplete: () => {
          this.isTransitioning = false;
          this.checkInfiniteLoop(index);
        }});
    } else {
      if (this.gsap) {
        this.gsap.killTweensOf(this.track.nativeElement);
      }
      this.track.nativeElement.style.transform = `translateX(${x}px)`;
      this.isTransitioning = false;
      if (animate) this.checkInfiniteLoop(index);
    }
  }

  /** Salto silencioso al índice real cuando rawIndex sale del rango (sólo modo infinito) */
  private checkInfiniteLoop(index: number) {
    if (!this.infiniteMode || this.totalItems === 0) return;
    if (index >= this.totalItems || index < 0) {
      const normalized = ((index % this.totalItems) + this.totalItems) % this.totalItems;
      this.rawIndex = normalized;
      this.currentIndex.set(normalized);
      this.applyTranslate(normalized, false);
      this.cdr.markForCheck();
    }
  }

  private clampIndex(i: number): number {
    const max = Math.max(0, this.totalItems - this.visibleItems);
    return Math.min(Math.max(i, 0), max);
  }

  // ─── Navegación pública ───────────────────────────────────────────────────

  goTo(index: number, animate = true) {
    if (this.totalItems === 0) return;

    if (this.infiniteMode) {
      // Si rawIndex previo estaba fuera de [0, totalItems - 1] (por clics/arrastres muy rápidos),
      // reajustamos el track silenciosamente a la posición equivalente antes de animar al nuevo destino
      if (this.rawIndex >= this.totalItems || this.rawIndex < 0) {
        const currentNorm = ((this.rawIndex % this.totalItems) + this.totalItems) % this.totalItems;
        const diff = index - this.rawIndex;
        this.rawIndex = currentNorm;
        this.applyTranslate(currentNorm, false);
        index = currentNorm + diff;
      }

      this.rawIndex = index;
      const normalized = ((index % this.totalItems) + this.totalItems) % this.totalItems;
      this.currentIndex.set(normalized);
      this.applyTranslate(index, animate);
      this.slideChange.emit(normalized);
    } else {
      const max = Math.max(0, this.totalItems - this.visibleItems);
      let target = index;
      if (this.loopVal && max > 0) {
        target = ((index % (max + 1)) + (max + 1)) % (max + 1);
      } else {
        target = this.clampIndex(index);
      }
      this.rawIndex = target;
      this.currentIndex.set(target);
      this.applyTranslate(target, animate);
      this.slideChange.emit(target);
    }
    this.cdr.markForCheck();
  }

  /** SIEMPRE usar rawIndex ± 1 */
  next() { this.goTo(this.rawIndex + 1); }
  prev() { this.goTo(this.rawIndex - 1); }

  goToPage(page: number) {
    const target = page * this.visibleItems;
    this.goTo(target);
  }

  // ─── Autoplay ─────────────────────────────────────────────────────────────

  private startAutoplay() {
    this.stopAutoplay();
    const ms = this.config.autoplayInterval ?? 3000;
    this.autoplayTimer = setInterval(() => this.ngZone.run(() => this.next()), ms);
  }

  private stopAutoplay() {
    if (this.autoplayTimer) { clearInterval(this.autoplayTimer); this.autoplayTimer = null; }
  }

  onMouseEnter() { if (this.config.autoplay) this.stopAutoplay(); }
  onMouseLeave() {
    if (this.config.autoplay) this.startAutoplay();
    if (this.isDragging) this.endDrag(0);
  }

  // ─── Drag / Touch (siempre activo, independiente de showArrows) ───────────

  private getTrackTranslateX(): number {
    if (!this.track) return this.currentTranslateX;
    try {
      const style = window.getComputedStyle(this.track.nativeElement);
      const matrix = new DOMMatrix(style.transform);
      return matrix.m41;
    } catch {
      return this.currentTranslateX;
    }
  }

  private startDragSession(clientX: number, clientY: number) {
    if (this.gsap && this.track) {
      this.gsap.killTweensOf(this.track.nativeElement);
    }
    this.isTransitioning = false;
    this.isDragging = true;
    this.wasDragged = false;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.startTranslateX = this.getTrackTranslateX();
    this.currentTranslateX = this.startTranslateX;
  }

  onDragStart(e: MouseEvent) {
    if (e.button !== 0) return;
    this.startDragSession(e.clientX, e.clientY);

    const onMove = (ev: MouseEvent) => {
      this.onDragMove(ev.clientX);
    };

    const onUp = (ev: MouseEvent) => {
      this.endDrag(ev.clientX - this.dragStartX);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private onDragMove(clientX: number) {
    if (!this.isDragging) return;
    const delta = clientX - this.dragStartX;
    if (Math.abs(delta) > 5) this.wasDragged = true;
    const x = this.startTranslateX + delta;
    this.currentTranslateX = x;
    if (this.gsap && this.track) {
      this.gsap.set(this.track.nativeElement, { x });
    } else if (this.track) {
      this.track.nativeElement.style.transform = `translateX(${x}px)`;
    }
  }

  getRealItemIndex(item: CarouselItemDirective): number {
    const arr = this.items?.toArray() || [];
    const idx = arr.indexOf(item);
    return idx >= 0 ? idx : 0;
  }

  /** Suprime el click en la card si el usuario arrastró > 5px, o emite slideClick si fue solo tap/click */
  onCardClick(e: Event, itemIndex: number) {
    if (this.wasDragged) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (this.totalItems === 0) return;
    const realIndex = ((itemIndex % this.totalItems) + this.totalItems) % this.totalItems;
    this.slideClick.emit(realIndex);
  }

  onTouchStart(e: TouchEvent) {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    this.startDragSession(touch.clientX, touch.clientY);
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging || !e.touches || e.touches.length === 0) return;
    const dX = e.touches[0].clientX - this.dragStartX;
    const dY = e.touches[0].clientY - this.dragStartY;
    if (Math.abs(dY) > Math.abs(dX)) return;
    if (Math.abs(dX) > 5) this.wasDragged = true;
    this.onDragMove(e.touches[0].clientX);
  }

  onTouchEnd(e: TouchEvent) {
    if (!this.isDragging) return;
    const endX = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0].clientX : this.dragStartX;
    this.endDrag(endX - this.dragStartX);
  }

  private endDrag(deltaX: number) {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (!this.trackWrapper) {
      this.applyTranslate(this.rawIndex);
      return;
    }

    const wrapperWidth = this.trackWrapper.nativeElement.offsetWidth;
    const gap = this.gapVal;
    const itemW = (wrapperWidth - gap * (this.visibleItems - 1)) / this.visibleItems;
    const stepWidth = itemW + gap;

    if (stepWidth <= 0) {
      this.applyTranslate(this.rawIndex);
      return;
    }

    // Calcular cuántas cards completas desplazó el usuario
    const itemsMoved = Math.round(-deltaX / stepWidth);

    if (itemsMoved !== 0) {
      this.goTo(this.rawIndex + itemsMoved);
    } else if (Math.abs(deltaX) > 30) {
      this.goTo(this.rawIndex + (deltaX < 0 ? 1 : -1));
    } else {
      this.wasDragged = false;
      this.applyTranslate(this.rawIndex);
    }
  }
}