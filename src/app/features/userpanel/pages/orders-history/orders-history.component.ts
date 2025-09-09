import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { PaginatorComponent } from '../../../../shared/components/generic/paginator/paginator.component';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [CommonModule,SelectsComponent,PaginatorComponent],
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent {

  sortOptions = [
    { label: 'Fecha de creación', value: 'creationDate' },
    { label: 'Estado', value: 'status' }
  ];

  orders = [
    {
      id: 'ORD-74646',
      creationDate: '2024-08-28',
      status: 'Entregado',
      products: [
        'https://tailwindui.com/img/ecommerce-images/order-history-page-06-product-01.jpg',
        'https://tailwindui.com/img/ecommerce-images/order-history-page-06-product-02.jpg',
        'https://tailwindui.com/img/ecommerce-images/order-history-page-06-product-03.jpg',
        'https://tailwindui.com/img/ecommerce-images/order-history-page-06-product-04.jpg',
      ],
      totalItems: 4
    },
    {
      id: 'ORD-74647',
      creationDate: '2024-08-25',
      status: 'En camino',
      products: [
        'https://tailwindui.com/img/ecommerce-images/order-history-page-02-product-01.jpg',
        'https://tailwindui.com/img/ecommerce-images/order-history-page-02-product-02.jpg',
      ],
      totalItems: 2
    },
    {
      id: 'ORD-74648',
      creationDate: '2024-08-22',
      status: 'Cancelado',
      products: [
        'https://tailwindui.com/img/ecommerce-images/order-history-page-03-product-01.jpg',
      ],
      totalItems: 1
    },
    {
      id: 'ORD-74648',
      creationDate: '2024-08-22',
      status: 'Cancelado',
      products: [
        'https://tailwindui.com/img/ecommerce-images/order-history-page-03-product-01.jpg',
      ],
      totalItems: 1
    },
    {
      id: 'ORD-74648',
      creationDate: '2024-08-22',
      status: 'Cancelado',
      products: [
        'https://tailwindui.com/img/ecommerce-images/order-history-page-03-product-01.jpg',
      ],
      totalItems: 1
    },
    {
      id: 'ORD-74648',
      creationDate: '2024-08-22',
      status: 'Cancelado',
      products: [
        'https://tailwindui.com/img/ecommerce-images/order-history-page-03-product-01.jpg',
      ],
      totalItems: 1
    },
    {
      id: 'ORD-74648',
      creationDate: '2024-08-22',
      status: 'Cancelado',
      products: [
        'https://tailwindui.com/img/ecommerce-images/order-history-page-03-product-01.jpg',
      ],
      totalItems: 1
    },
  ];

  currentPage = 1;
  pageSize = 5;

  get paginatedOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1; 
  }
}
