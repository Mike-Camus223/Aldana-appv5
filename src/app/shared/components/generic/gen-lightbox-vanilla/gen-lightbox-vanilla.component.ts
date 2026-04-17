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
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaItem } from '../../../utils/models/objectsGallery.model';

@Component({
  selector: 'app-gen-lightbox-vanilla',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gen-lightbox-vanilla.component.html',
  styleUrls: ['./gen-lightbox-vanilla.component.css'],
})
export class GenLightboxVanillaComponent implements OnChanges, AfterViewInit {

  @Input() isOpen = false;
  @Input() items: MediaItem[] = [];
  @Input() startIndex = 0;

  @Output() closed = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  @ViewChildren('slideRef') slideRefs!: QueryList<ElementRef<HTMLElement>>;

  activeIndex = 0;
  zoomed = false;
  isClosing = false;

  // DRAG ORIGINAL (NO TOCADO)
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

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isOpen && (changes['startIndex'] || changes['items'])) {
      this.activeIndex = this.clampIndex(this.startIndex);
      setTimeout(() => this.initSlides(), 0);
    }
  }

  ngAfterViewInit(): void {
    this.initSlides();
  }

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
  }

  // ─── ZOOM ORIGINAL ─────────────────

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

  // ─── DRAG ORIGINAL (INTACTO) ─────────────────

  startDrag(e: MouseEvent): void {
    if (!this.zoomed) return;
    e.preventDefault();
    this.isDragging = true;
    this._dragMoved = false;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragOriginX = this.translateX;
    this.dragOriginY = this.translateY;
  }

  onDrag(e: MouseEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();
    this._dragMoved = true;

    const dx = (e.clientX - this.dragStartX) / this.ZOOM_SCALE;
    const dy = (e.clientY - this.dragStartY) / this.ZOOM_SCALE;

    const maxX = (this.FRAME_W * (this.ZOOM_SCALE - 1)) / (2 * this.ZOOM_SCALE);
    const maxY = (this.FRAME_H * (this.ZOOM_SCALE - 1)) / (2 * this.ZOOM_SCALE);

    this.translateX = Math.max(-maxX, Math.min(maxX, this.dragOriginX + dx));
    this.translateY = Math.max(-maxY, Math.min(maxY, this.dragOriginY + dy));
  }

  stopDrag(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    this.translateX = 0;
    this.translateY = 0;

    setTimeout(() => { this._dragMoved = false; }, 0);
  }

  resetDrag(): void {
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this._dragMoved = false;
  }

  resetZoom(): void {
    this.zoomed = false;
    this.resetDrag();
  }

  // ─── SLIDER CORRECTO ─────────────────

  next(): void {
    this.animateSlide('next');
  }

  prev(): void {
    this.animateSlide('prev');
  }

  goTo(i: number): void {
    if (i === this.activeIndex) return;
    const dir = i > this.activeIndex ? 'next' : 'prev';
    this.animateSlide(dir, i);
  }

  private animateSlide(dir: 'next' | 'prev', targetIndex?: number): void {
    this.resetZoom();

    const slides = this.slideRefs.toArray();
    if (!slides.length) return;

    const currentIdx = this.activeIndex;

    const nextIdx = targetIndex !== undefined
      ? this.clampIndex(targetIndex)
      : this.clampIndex(currentIdx + (dir === 'next' ? 1 : -1));

    if (currentIdx === nextIdx) return;

    const currentEl = slides[currentIdx].nativeElement;
    const nextEl = slides[nextIdx].nativeElement;

    const DIST = 1200; // 🔥 fuera de vista SIEMPRE

    const xOut = dir === 'next' ? -DIST : DIST;
    const xIn  = dir === 'next' ?  DIST : -DIST;

    nextEl.style.transition = 'none';
    nextEl.style.transform = `translateX(${xIn}px)`;
    nextEl.style.opacity = '1';
    nextEl.style.zIndex = '2';

    currentEl.style.zIndex = '1';

    requestAnimationFrame(() => {
      currentEl.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1)';
      nextEl.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1)';

      currentEl.style.transform = `translateX(${xOut}px)`;
      nextEl.style.transform = `translateX(0px)`;
    });

    setTimeout(() => {
      currentEl.style.opacity = '0';
      currentEl.style.transform = 'translateX(0px)';
      currentEl.style.transition = '';
      currentEl.style.zIndex = '0';

      nextEl.style.transition = '';
      nextEl.style.zIndex = '1';

      this.activeIndex = nextIdx;
      this.indexChange.emit(this.activeIndex);
    }, 450);
  }

  // ─── KEYBOARD ─────────────────

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.stopDrag();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(evt: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (evt.key === 'Escape') this.close();
    if (evt.key === 'ArrowRight') this.next();
    if (evt.key === 'ArrowLeft') this.prev();
  }

  close(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.zoomed = false;
      this.resetDrag();
      this.isOpen = false;
      this.closed.emit();
    }, 250);
  }

  private clampIndex(index: number): number {
    const len = this.items?.length ?? 0;
    return ((index % len) + len) % len;
  }
}