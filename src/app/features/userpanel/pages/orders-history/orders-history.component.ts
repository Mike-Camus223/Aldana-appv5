import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { PaginatorComponent } from '../../../../shared/components/generic/paginator/paginator.component';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { OrderSummary } from '../../../../shared/utils/models/order.interface';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [CommonModule, SelectsComponent, PaginatorComponent],
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent implements OnInit {
  sortOptions = [
    { label: 'Fecha de creación', value: 'creationDate' },
    { label: 'Estado', value: 'status' }
  ];

  orders: OrderSummary[] = [];
  loading = true;
  error: string | null = null;
  currentPage = 1;
  pageSize = 5;

  get totalPages(): number {
    return Math.ceil(this.orders.length / this.pageSize);
  }

  constructor(
    private ordersService: OrdersService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserOrders();
  }

  async loadUserOrders() {
    this.loading = true;
    this.error = null;

    try {
      const result = await this.ordersService.getUserOrders();
      
      if (result.success && result.orders) {
        this.orders = result.orders;
      } else {
        this.error = result.error || 'Error al cargar las órdenes';
      }
    } catch (error: any) {
      this.error = 'Error inesperado al cargar las órdenes';
      console.error('Error loading orders:', error);
    } finally {
      this.loading = false;
    }
  }

  get paginatedOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in_transit': 'En camino',
      'completed': 'Entregado',
      'rejected': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'pending': 'text-yellow-600',
      'in_transit': 'text-blue-600',
      'completed': 'text-green-600',
      'rejected': 'text-red-600'
    };
    return classMap[status] || 'text-gray-600';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  viewOrderDetails(orderId: string) {
    console.log('Navegando a detalles de la orden:', orderId);
    this.router.navigate(['/panel/order-details', orderId])
      .then(success => {
        if (!success) {
          console.error('Error de navegación: No se pudo cargar la ruta');
        }
      })
      .catch(error => {
        console.error('Error de navegación:', error);
      });
  }

  getProductImages(products: any[]): string[] {
    if (!Array.isArray(products)) return [];
    return products.slice(0, 4).map(product => product.image || 'https://via.placeholder.com/60');
  }
}
