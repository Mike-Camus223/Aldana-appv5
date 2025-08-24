import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footerv2',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footerv2.component.html',
  styleUrl: './footerv2.component.css'
})
export class Footerv2Component {
  readonly tiendaItems = [
    'Camisas',
    'Blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos'
  ];

  normalizeCategory(item: string): string {
    return item.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
  }
}