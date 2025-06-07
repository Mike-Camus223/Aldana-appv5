import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  ViewEncapsulation,
  ElementRef,
  OnChanges,
  SimpleChanges,
  AfterViewInit
} from '@angular/core';
import { Carousel } from '@fancyapps/ui';
import { Thumbs } from '@fancyapps/ui/dist/carousel/carousel.thumbs.esm.js';

@Component({
  selector: 'app-fancy-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fancy-carousel.component.html',
  styleUrls: ['./fancy-carousel.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FancyCarouselComponent implements AfterViewInit, OnChanges {
  @Input() images: { src: string; thumb: string }[] = [];

  private carouselInstance: Carousel | null = null;
  private isViewInitialized = false;

  constructor(private host: ElementRef) { }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.setupCarouselIfReady();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && !changes['images'].firstChange) {
      this.setupCarouselIfReady();
    }
  }
  private setupCarouselIfReady(): void {
    if (!this.isViewInitialized) return;
    this.destroyCarousel();
    setTimeout(() => {
      const carouselElement = this.host.nativeElement.querySelector('.f-carousel');
      if (carouselElement) {
        this.carouselInstance = new Carousel(
          carouselElement,
          {
            Dots: false,
            Thumbs: { type: 'modern' }
          },
          { Thumbs }
        );
      }
    }, 0);
  }
  private destroyCarousel(): void {
    if (this.carouselInstance) {
      this.carouselInstance.destroy();
      this.carouselInstance = null;
    }
  }
}
