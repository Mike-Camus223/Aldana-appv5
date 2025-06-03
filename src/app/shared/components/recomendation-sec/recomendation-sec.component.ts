import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-recomendation-sec',
  standalone: true,
  imports: [CarouselModule, RouterModule, CommonModule, TagModule, ButtonModule],
  templateUrl: './recomendation-sec.component.html',
  styleUrls: ['./recomendation-sec.component.css'],
})
export class RecomendationSecComponent {
  products = [
    {
      name: 'Linen Cinched-Waist Jumpsuit',
      price: 200000,
      image: 'https://picsum.photos/id/229/600/600',
    },
    {
      name: 'Linen Cinched-Waist Jumpsuit',
      price: 180000,
      image: 'https://picsum.photos/id/227/600/600',
    },
    {
      name: 'Linen Cinched-Waist Jumpsuit',
      price: 250000,
      image: 'https://picsum.photos/id/217/600/600',
    },
    {
      name: 'Linen Cinched-Waist Jumpsuit',
      price: 150000,
      image: 'https://picsum.photos/id/437/600/600',
    },
  ];

  responsiveOptions = [
    { breakpoint: '1178px', numVisible: 3, numScroll: 1 },
    { breakpoint: '768px', numVisible: 3.05, numScroll: 2 },
    { breakpoint: '640px', numVisible: 2.05, numScroll: 1 },
    { breakpoint: '438px', numVisible: 1, numScroll: 1 },

  ];
}
