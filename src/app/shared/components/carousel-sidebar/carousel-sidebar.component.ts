import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-carousel-sidebar',
  standalone: true,
  imports: [CommonModule, CarouselModule, ButtonModule, TagModule],
  templateUrl: './carousel-sidebar.component.html',
  styleUrls: ['./carousel-sidebar.component.css']
})
export class CarouselSidebarComponent implements OnInit {
  dresses: any[] = [];
  responsiveOptions: any[] = [];
  wishlisted = false;

  ngOnInit() {
    this.dresses = [
      {
        name: 'Vestido Floral Elegante',
        image: 'https://picsum.photos/id/1025/600/800',
        price: 89000,
        inventoryStatus: 'Stock',
        wishlisted: false
      },
      {
        name: 'Vestido de Negro',
        image: 'https://picsum.photos/id/1003/600/800',
        price: 129000,
        inventoryStatus: 'Bajo Stock',
        wishlisted: false
      },
      {
        name: 'Vestido de Verano Rojo',
        image: 'https://picsum.photos/id/1012/600/800',
        price: 158000,
        inventoryStatus: 'Stock',
        wishlisted: false
      },
      {
        name: 'Vestido Blanco Casual',
        image: 'https://picsum.photos/id/1018/600/800',
        price: 340000,
        inventoryStatus: 'Sin Stock',
        wishlisted: false
      }
    ];

    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 2,
        numScroll: 2
      },
      {
        breakpoint: '1199px',
        numVisible: 2,
        numScroll: 2
      },
      {
        breakpoint: '639px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1
      }
    ];
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Stock':
        return 'success';
      case 'Bajo Stock':
        return 'warn';
      case 'Sin Stock':
        return 'danger';
    }
    return '';
  }

  formatPrice(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(value);
}
}
