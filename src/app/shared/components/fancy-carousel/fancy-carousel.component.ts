import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, Input, ViewEncapsulation, ElementRef } from '@angular/core';
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
export class FancyCarouselComponent implements AfterViewInit {
  @Input() images: { src: string; thumb: string }[] = [];

  constructor(private host: ElementRef) {}

  ngAfterViewInit(): void {
    const carouselElement = this.host.nativeElement.querySelector('.f-carousel');
    if (carouselElement) {
      new Carousel(
        carouselElement,
        {
          Dots: false,
          Thumbs: { type: 'modern' }
        },
        { Thumbs }
      );
    }
  }
}
