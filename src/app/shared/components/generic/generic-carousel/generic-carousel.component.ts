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
  TemplateRef,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselItemDirective } from '../../../utils/directives/carousel-slide.directive';

export interface CarouselConfig {
  autoplay?: boolean;
  autoplayInterval?: number;
  loop?: boolean;
  visibleItems?: number;
  gap?: number;
  animationDuration?: number;
  showDots?: boolean;
  showArrows?: boolean;
  dragEnabled?: boolean;
}

@Component({
  selector: 'app-generic-carousel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative w-full overflow-hidden select-none"
      #carouselRoot
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Track wrapper -->
      <div class="relative overflow-hidden w-full" #trackWrapper>
        <div
          class="flex will-change-transform"
          #track
          [style.gap.px]="config.gap ?? 16"
          (mousedown)="onDragStart($event)"
          (touchstart)="onTouchStart($event)"
          (touchmove)="onTouchMove($event)"
          (touchend)="onTouchEnd($event)"
        >
          <div
            *ngFor="let item of items; let i = index"
            class="flex-shrink-0"
            [style.width]="itemWidth"
            #slideEl
          >
            <ng-container [ngTemplateOutlet]="item.templateRef" />
          </div>
        </div>
      </div>

      <!-- Prev Arrow -->
      <button
        *ngIf="config.showArrows !== false"
        (click)="prev()"
        [class.opacity-30]="!canGoPrev && !config.loop"
        [class.pointer-events-none]="!canGoPrev && !config.loop"
        class="
          absolute left-2 top-1/2 -translate-y-1/2 z-20
          flex items-center justify-center
          w-10 h-10 rounded-full
          bg-white/10 backdrop-blur-sm border border-white/20
          text-white shadow-lg
          transition-all duration-200
          hover:bg-white/25 hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-white/40
        "
        aria-label="Previous slide"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Next Arrow -->
      <button
        *ngIf="config.showArrows !== false"
        (click)="next()"
        [class.opacity-30]="!canGoNext && !config.loop"
        [class.pointer-events-none]="!canGoNext && !config.loop"
        class="
          absolute right-2 top-1/2 -translate-y-1/2 z-20
          flex items-center justify-center
          w-10 h-10 rounded-full
          bg-white/10 backdrop-blur-sm border border-white/20
          text-white shadow-lg
          transition-all duration-200
          hover:bg-white/25 hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-white/40
        "
        aria-label="Next slide"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Dots -->
      <div
        *ngIf="config.showDots !== false && totalPages > 1"
        class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
        role="tablist"
      >
        <button
          *ngFor="let page of pagesArray; let i = index"
          (click)="goToPage(i)"
          role="tab"
          [attr.aria-selected]="currentPage() === i"
          [attr.aria-label]="'Go to slide ' + (i + 1)"
          class="rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/60"
          [class]="
            currentPage() === i
              ? 'w-6 h-2 bg-white'
              : 'w-2 h-2 bg-white/40 hover:bg-white/70'
          "
        ></button>
      </div>
    </div>
  `,
})
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
  currentPage = computed(() =>
    Math.floor(this.currentIndex() / this.visibleItems)
  );

  totalItems = 0;
  totalPages = 0;
  pagesArray: number[] = [];
  itemWidth = '100%';

  private gsap: any;
  private autoplayTimer: any;
  private dragStartX = 0;
  private dragStartY = 0;
  private isDragging = false;
  private startTranslateX = 0;
  private resizeObserver?: ResizeObserver;

  get visibleItems(): number {
    return this.config.visibleItems ?? 1;
  }

  get canGoPrev(): boolean {
    return this.currentIndex() > 0;
  }

  get canGoNext(): boolean {
    return this.currentIndex() < this.totalItems - this.visibleItems;
  }

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) { }

  async ngAfterContentInit() {
    this.totalItems = this.items.length;
    this.calculatePages();

    this.items.changes.subscribe(() => {
      this.totalItems = this.items.length;
      this.calculatePages();
      this.cdr.markForCheck();
    });
  }

  async ngAfterViewInit() {
    // Load GSAP
    try {
      const gsapModule = await import('gsap');
      this.gsap = gsapModule.gsap ?? gsapModule.default ?? gsapModule;
    } catch {
      this.gsap = null;
    }

    this.calculateItemWidth();
    this.setupResizeObserver();
    this.applyTranslate(0, false);

    if (this.config.autoplay) {
      this.startAutoplay();
    }
  }

  ngOnDestroy() {
    this.stopAutoplay();
    this.resizeObserver?.disconnect();
  }

  private calculatePages() {
    this.totalPages = Math.ceil(this.totalItems / this.visibleItems);
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i);
  }

  private calculateItemWidth() {
    if (!this.trackWrapper) return;
    const wrapperWidth = this.trackWrapper.nativeElement.offsetWidth;
    const gap = this.config.gap ?? 16;
    const totalGap = gap * (this.visibleItems - 1);
    const width = (wrapperWidth - totalGap) / this.visibleItems;
    this.itemWidth = `${width}px`;
    this.cdr.markForCheck();
  }

  private setupResizeObserver() {
    if (!this.trackWrapper) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.calculateItemWidth();
        this.applyTranslate(this.currentIndex(), false);
      });
    });
    this.resizeObserver.observe(this.trackWrapper.nativeElement);
  }

  private getTranslateX(index: number): number {
    if (!this.trackWrapper) return 0;
    const wrapperWidth = this.trackWrapper.nativeElement.offsetWidth;
    const gap = this.config.gap ?? 16;
    const itemW = (wrapperWidth - gap * (this.visibleItems - 1)) / this.visibleItems;
    return -(index * (itemW + gap));
  }

  private applyTranslate(index: number, animate = true) {
    if (!this.track) return;
    const x = this.getTranslateX(index);
    const duration = (this.config.animationDuration ?? 500) / 1000;

    if (this.gsap && animate) {
      this.gsap.to(this.track.nativeElement, {
        x,
        duration,
        ease: 'power3.out',
      });
    } else {
      this.track.nativeElement.style.transform = `translateX(${x}px)`;
    }
  }

  goTo(index: number, animate = true) {
    const max = Math.max(0, this.totalItems - this.visibleItems);
    let next = index;

    if (this.config.loop) {
      next = ((index % this.totalItems) + this.totalItems) % this.totalItems;
      next = Math.min(next, max);
    } else {
      next = Math.max(0, Math.min(index, max));
    }

    this.currentIndex.set(next);
    this.applyTranslate(next, animate);
    this.slideChange.emit(next);
    this.cdr.markForCheck();
  }

  next() {
    const next = this.canGoNext
      ? this.currentIndex() + 1
      : this.config.loop
        ? 0
        : this.currentIndex();
    this.goTo(next);
  }

  prev() {
    const prev = this.canGoPrev
      ? this.currentIndex() - 1
      : this.config.loop
        ? this.totalItems - this.visibleItems
        : this.currentIndex();
    this.goTo(prev);
  }

  goToPage(page: number) {
    this.goTo(page * this.visibleItems);
  }

  private startAutoplay() {
    this.stopAutoplay();
    const interval = this.config.autoplayInterval ?? 3000;
    this.autoplayTimer = setInterval(() => this.ngZone.run(() => this.next()), interval);
  }

  private stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  onMouseEnter() {
    if (this.config.autoplay) this.stopAutoplay();
  }

  onMouseLeave() {
    if (this.config.autoplay) this.startAutoplay();
    if (this.isDragging) this.endDrag();
  }

  // ─── Drag / Touch ─────────────────────────────────────────────────────────

  onDragStart(e: MouseEvent) {
    if (this.config.dragEnabled === false) return;
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.startTranslateX = this.getTranslateX(this.currentIndex());

    const onMove = (ev: MouseEvent) => this.onDragMove(ev);
    const onUp = () => {
      this.endDrag();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private onDragMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const delta = e.clientX - this.dragStartX;
    if (this.gsap) {
      this.gsap.set(this.track.nativeElement, { x: this.startTranslateX + delta });
    } else {
      this.track.nativeElement.style.transform = `translateX(${this.startTranslateX + delta}px)`;
    }
  }

  onTouchStart(e: TouchEvent) {
    if (this.config.dragEnabled === false) return;
    this.isDragging = true;
    this.dragStartX = e.touches[0].clientX;
    this.dragStartY = e.touches[0].clientY;
    this.startTranslateX = this.getTranslateX(this.currentIndex());
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    const deltaX = e.touches[0].clientX - this.dragStartX;
    const deltaY = e.touches[0].clientY - this.dragStartY;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    e.preventDefault();
    if (this.gsap) {
      this.gsap.set(this.track.nativeElement, { x: this.startTranslateX + deltaX });
    } else {
      this.track.nativeElement.style.transform = `translateX(${this.startTranslateX + deltaX}px)`;
    }
  }

  onTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - this.dragStartX;
    this.resolveSwipe(deltaX);
  }

  private endDrag() {
    this.isDragging = false;
    this.applyTranslate(this.currentIndex());
  }

  private resolveSwipe(deltaX: number) {
    this.isDragging = false;
    const threshold = 50;
    if (deltaX < -threshold) this.next();
    else if (deltaX > threshold) this.prev();
    else this.applyTranslate(this.currentIndex());
  }
}