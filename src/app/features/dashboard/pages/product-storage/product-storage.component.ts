import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-storage',
  imports: [CommonModule],
  templateUrl: './product-storage.component.html',
  styles: ``
})
export class ProductStorageComponent {
  
  // Datos hardcodeados para inventario
  products = [
    {
      id: 1,
      name: 'Vestido Elegante Rosa',
      sku: 'VER-001',
      category: 'Vestidos',
      price: 89.99,
      stock: 15,
      status: 'Disponible',
      image: 'https://via.placeholder.com/60x60'
    },
    {
      id: 2,
      name: 'Blusa Casual Azul',
      sku: 'BLU-002',
      category: 'Blusas',
      price: 45.50,
      stock: 8,
      status: 'Bajo Stock',
      image: 'https://via.placeholder.com/60x60'
    },
    {
      id: 3,
      name: 'Falda Midi Negra',
      sku: 'FAL-003',
      category: 'Faldas',
      price: 65.00,
      stock: 0,
      status: 'Agotado',
      image: 'https://via.placeholder.com/60x60'
    },
    {
      id: 4,
      name: 'Chaqueta Denim',
      sku: 'CHA-004',
      category: 'Chaquetas',
      price: 120.00,
      stock: 25,
      status: 'Disponible',
      image: 'https://via.placeholder.com/60x60'
    }
  ];
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'Disponible': return 'bg-green-100 text-green-800';
      case 'Bajo Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Agotado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
