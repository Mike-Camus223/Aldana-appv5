import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Carousel } from '@fancyapps/ui';
import { Thumbs } from '@fancyapps/ui/dist/carousel/carousel.thumbs.esm.js';


@Component({
  selector: 'app-fancy-carousel',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './fancy-carousel.component.html',
  styleUrls: ['./fancy-carousel.component.css'],
  encapsulation: ViewEncapsulation.None 
})
export class FancyCarouselComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    new Carousel(
      document.getElementById('myCarousel') as HTMLElement,
      {
        Dots: false,
        Thumbs: {
          type: 'classic'
        }
      },
      { Thumbs }
    );
  }
}
