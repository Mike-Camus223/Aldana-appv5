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
  tiendaItems = [
    'Camisas y Blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos'
  ];

  formatRoute(item: string): string {
    return '/' + item.toLowerCase().replace(/\s+/g, '-');
  }
}
