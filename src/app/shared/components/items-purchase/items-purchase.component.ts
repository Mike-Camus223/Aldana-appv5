import { Component, AfterViewInit} from '@angular/core';
import { Carousel } from '@fancyapps/ui';
import { Thumbs } from '@fancyapps/ui/dist/carousel/carousel.thumbs.esm.js';
import { Panzoom } from '@fancyapps/ui';
import { CommonModule } from '@angular/common';
import {  AccordionModule } from 'primeng/accordion';
import { FancyCarouselComponent } from '../fancy-carousel/fancy-carousel.component';

@Component({
  selector: 'app-items-purchase',
  templateUrl: './items-purchase.component.html',
  imports: [CommonModule, AccordionModule],
  standalone: true,
  styleUrls: ['./items-purchase.component.css'],
})
// export class ItemsPurchaseComponent implements AfterViewInit {
//    products = [
//     {
//       id: 8,
//       name: 'BLUSA DRAPEADA BATIKK LAWN A',
//       description: 'Blusa oversize batik en rojo',
//       price: 2110,
//       image: 'https://picsum.photos/id/1025/600/800',
//       colors: ['#9c0b14', '#ffffff'],
//       wishlisted: false
//     },
//   ];

//   selectedColors: Record<number, string> = {};

//   ngAfterViewInit(): void {
//     this.products.forEach((product) => {
//       const carousel = document.getElementById(`carousel-${product.id}`);
//       if (carousel) {
//         new Carousel(carousel, {
//           Dots: false,
//           Thumbs: {
//             type: 'modern',
//           },
//         }, {
//           Thumbs,
//         });

//         // Agrega panzoom a cada imagen del carousel
//         const images = carousel.querySelectorAll('img');
//         images.forEach((img) => {
//           new Panzoom(img as HTMLElement, {
//             panMode: 'mousemove',
//             mouseMoveFactor: 1.1,
//           });
//         });
//       }
//     });
//   }

//   selectColor(productId: number, color: string): void {
//     this.selectedColors[productId] = color;
//   }

//   toggleWishlist(product: any): void {
//     product.wishlisted = !product.wishlisted;
//   }
// }

export class ItemsPurchaseComponent implements AfterViewInit {
  product = {
    id: 1,
    name: 'BLUSA DRAPEADA BATIKK LAWN A',
    description: 'Blusa oversize batik en rojo',
    price: 2110,
    image: 'https://picsum.photos/id/1025/600/800',
    colors: ['#9c0b14', '#f1f1f1'],
    wishlisted: false
  };

  selectedColors: Record<number, string> = {};
  selectedSize: string = 'S'; 

  ngAfterViewInit(): void {
    const carousel = document.getElementById(`carousel-${this.product.id}`);
    if (carousel) {
      new Carousel(carousel, {
        Dots: false,
        Thumbs: { type: 'modern' }
      }, { Thumbs });

      const images = carousel.querySelectorAll('img');
      images.forEach((img) => {
        new Panzoom(img as HTMLElement, {
          panMode: 'mousemove',
          mouseMoveFactor: 1.1,
        });
      });
    }
  }

  selectColor(productId: number, color: string): void {
    this.selectedColors[productId] = color;
  }

  toggleWishlist(product: any): void {
    product.wishlisted = !product.wishlisted;
  }
}
