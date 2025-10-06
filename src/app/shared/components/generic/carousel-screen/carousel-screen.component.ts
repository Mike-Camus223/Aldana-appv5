// carousel-screen.component.ts
import { Component, Input, PLATFORM_ID, Inject, OnInit, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';

export interface CarouselSlide {
  image: string;
  announcement?: {
    text: string;
    buttonText: string;
    buttonLink: string;
  };
}

@Component({
  selector: 'app-carousel-screen',
  standalone: true,
  imports: [CommonModule, WordRevealDirective],
  templateUrl: './carousel-screen.component.html',
  styleUrl: './carousel-screen.component.css'
})
export class CarouselScreenComponent implements OnInit, AfterViewInit {
  @Input() slides: CarouselSlide[] = [];
  
  currentIndex = 0;
  isDragging = false;
  startX = 0;
  startTime = 0;
  currentTranslate = 0;
  prevTranslate = 0;
  animationId = 0;
  isBrowser: boolean;
  private threshold = 50;
  private velocityThreshold = 0.3;
  private containerWidth = 0;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.updateContainerWidth();
      this.setPositionByIndex();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.updateContainerWidth();
        this.setPositionByIndex();
      }, 0);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isBrowser) {
      this.updateContainerWidth();
      this.setPositionByIndex();
    }
  }

  private updateContainerWidth(): void {
    if (this.isBrowser) {
      this.containerWidth = window.innerWidth;
    }
  }

  get transform(): string {
    return `translateX(${this.currentTranslate}px)`;
  }

  getSlideId(index: number): string {
    return `slide-${this.currentIndex}-${index}`;
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.isBrowser || this.slides.length === 0) return;
    this.isDragging = true;
    this.startX = event.touches[0].clientX;
    this.startTime = Date.now();
    this.animationId = requestAnimationFrame(this.animation.bind(this));
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || !this.isBrowser) return;
    const currentX = event.touches[0].clientX;
    const diff = currentX - this.startX;
    this.currentTranslate = this.prevTranslate + diff;
  }

  onTouchEnd(): void {
    if (!this.isBrowser || !this.isDragging) return;
    cancelAnimationFrame(this.animationId);
    this.isDragging = false;
    
    const movedBy = this.currentTranslate - this.prevTranslate;
    const duration = Date.now() - this.startTime;
    const velocity = Math.abs(movedBy) / duration;
    
    if (velocity > this.velocityThreshold || Math.abs(movedBy) > this.threshold) {
      if (movedBy < 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    } else {
      this.setPositionByIndex();
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.isBrowser || this.slides.length === 0) return;
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.startTime = Date.now();
    this.animationId = requestAnimationFrame(this.animation.bind(this));
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.isBrowser) return;
    event.preventDefault();
    const currentX = event.clientX;
    const diff = currentX - this.startX;
    this.currentTranslate = this.prevTranslate + diff;
  }

  onMouseUp(): void {
    if (!this.isBrowser || !this.isDragging) return;
    cancelAnimationFrame(this.animationId);
    this.isDragging = false;
    
    const movedBy = this.currentTranslate - this.prevTranslate;
    const duration = Date.now() - this.startTime;
    const velocity = Math.abs(movedBy) / duration;
    
    if (velocity > this.velocityThreshold || Math.abs(movedBy) > this.threshold) {
      if (movedBy < 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    } else {
      this.setPositionByIndex();
    }
  }

  onMouseLeave(): void {
    if (this.isDragging && this.isBrowser) {
      this.onMouseUp();
    }
  }

  private animation(): void {
    if (this.isDragging) {
      requestAnimationFrame(this.animation.bind(this));
    }
  }

  private nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.setPositionByIndex();
  }

  private prevSlide(): void {
    this.currentIndex = this.currentIndex === 0 ? this.slides.length - 1 : this.currentIndex - 1;
    this.setPositionByIndex();
  }

  setPositionByIndex(): void {
    if (!this.isBrowser) return;
    this.currentTranslate = this.currentIndex * -this.containerWidth;
    this.prevTranslate = this.currentTranslate;
  }

  goToSlide(index: number): void {
    if (!this.isBrowser || index < 0 || index >= this.slides.length) return;
    this.currentIndex = index;
    this.setPositionByIndex();
  }
}