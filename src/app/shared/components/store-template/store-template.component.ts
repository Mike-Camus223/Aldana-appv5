import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { AldyCheckboxV1Directive } from '../../utils/directives/aldy-checkbox-v1.directive';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-store-template',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
    CheckboxModule,
    SliderModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './store-template.component.html',
  styleUrls: ['./store-template.component.css']
})
export class StoreTemplateComponent {
  selectedStock: Record<string, boolean> = {};
  selectedCategories: Record<string, boolean> = {};
  selectedSizes: Record<string, boolean> = {};
  selectedColorsStock: Record<string, boolean> = {};
  selectedMaterials: Record<string, boolean> = {};
  priceRange: number[] = [0, 500000];
  selectedColors: Record<number, string> = {};

  sections = [
    'Camisas y blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos'
  ];




  products = [
    {
      id: 1,
      name: 'BLUSA DRAPEADA BATIKK LAWN A',
      description: 'Blusa oversize batik en rojo',
      price: 2110,
      image: 'https://picsum.photos/id/1025/600/800',
      colors: ['#9c0b14', '#ffffff'],
      wishlisted: false
    },
    {
      id: 2,
      name: 'BLUSA DRAPEADA BATIKK LAWN B',
      description: 'Blusa oversize batik en azul',
      price: 2150,
      image: 'https://picsum.photos/id/1026/600/800',
      colors: ['#000000', '#ececec'],
      wishlisted: false
    },
    {
      id: 3,
      name: 'BLUSA DRAPEADA BATIKK LAWN C',
      description: 'Blusa oversize batik en verde',
      price: 2180,
      image: 'https://picsum.photos/id/1027/600/800',
      colors: ['#1e7e34', '#cce5ff'],
      wishlisted: false
    },
    {
      id: 4,
      name: 'BLUSA DRAPEADA BATIKK LAWN D',
      description: 'Blusa oversize batik en negro',
      price: 2190,
      image: 'https://picsum.photos/id/1028/600/800',
      colors: ['#333333', '#aaaaaa'],
      wishlisted: false
    },
    {
      id: 5,
      name: 'BLUSA DRAPEADA BATIKK LAWN A',
      description: 'Blusa oversize batik en rojo',
      price: 2110,
      image: 'https://picsum.photos/id/1025/600/800',
      colors: ['#9c0b14', '#ffffff'],
      wishlisted: false
    },
    {
      id: 6,
      name: 'BLUSA DRAPEADA BATIKK LAWN A',
      description: 'Blusa oversize batik en rojo',
      price: 2110,
      image: 'https://picsum.photos/id/1025/600/800',
      colors: ['#9c0b14', '#ffffff'],
      wishlisted: false
    },
    {
      id: 7,
      name: 'BLUSA DRAPEADA BATIKK LAWN A',
      description: 'Blusa oversize batik en rojo',
      price: 2110,
      image: 'https://picsum.photos/id/1025/600/800',
      colors: ['#9c0b14', '#ffffff'],
      wishlisted: false
    },
    {
      id: 8,
      name: 'BLUSA DRAPEADA BATIKK LAWN A',
      description: 'Blusa oversize batik en rojo',
      price: 2110,
      image: 'https://picsum.photos/id/1025/600/800',
      colors: ['#9c0b14', '#ffffff'],
      wishlisted: false
    },
  ];

  toggleWishlist(product: any): void {
    product.wishlisted = !product.wishlisted;
  }

  selectColor(productId: number, color: string): void {
    this.selectedColors[productId] = color;
  }
}
