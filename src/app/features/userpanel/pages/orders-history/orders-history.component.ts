import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { PaginatorComponent } from '../../../../shared/components/generic/paginator/paginator.component';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { OrderSummary } from '../../../../shared/utils/models/order.interface';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SelectsComponent, PaginatorComponent],
  templateUrl: './orders-history.component.html', styleUrls: ['./orders-history.component.css']
})
export class OrdersHistoryComponent implements OnInit {
  sortOptions = [
    { label: 'Más recientes', value: 'recent' },
    { label: 'Más antiguas', value: 'oldest' },
    { label: 'Mayor valor', value: 'highest' },
    { label: 'Menor valor', value: 'lowest' }
  ];

  orders: OrderSummary[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 1;
  pageSize = 5;
  selectedSort = 'recent';

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.orders.length / this.pageSize));
  }

  get paginatedOrders(): OrderSummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.orders.slice(start, start + this.pageSize);
  }

  constructor(
    private ordersService: OrdersService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadUserOrders();
  }

  navigateToStore(): void {
    this.router.navigate(['/tienda']);
  }

  async loadUserOrders(forceRefresh = false) {
    if (this.orders.length === 0) {
      this.loading = true;
      this.cdr.detectChanges();
    }
    this.error = null;

    try {
      const result = await this.ordersService.getUserOrders(forceRefresh);

      if (result.success && result.orders && result.orders.length > 0) {
        this.orders = result.orders;
        this.applySort();
      } else if (result.success && result.orders) {
        this.orders = [];
      } else {
        this.orders = [];
        this.error = result.error || null;
      }
    } catch (error: any) {
      this.error = 'Error inesperado al cargar las órdenes';
      console.error('Error loading orders:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onSortChange(sort: string) {
    this.selectedSort = sort;
    this.applySort();
    this.currentPage = 1;
  }

  private applySort() {
    if (this.selectedSort === 'recent') {
      this.orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (this.selectedSort === 'oldest') {
      this.orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (this.selectedSort === 'highest') {
      this.orders.sort((a, b) => (b.total_final || 0) - (a.total_final || 0));
    } else if (this.selectedSort === 'lowest') {
      this.orders.sort((a, b) => (a.total_final || 0) - (b.total_final || 0));
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pago pendiente',
      'preparing': 'En preparación',
      'in_transit': 'En camino',
      'completed': 'Entregado',
      'rejected': 'Pago rechazado'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-[#E2EAE0] text-[#556F52]';
      case 'preparing':
        return 'bg-[#F5EBE1] text-[#947659]';
      case 'pending':
        return 'bg-[#FDF6B2] text-[#92400E]';
      case 'in_transit':
        return 'bg-[#E3EAF2] text-[#4A6785]';
      case 'rejected':
        return 'bg-[#FBEAEA] text-[#9E5252]';
      default:
        return 'bg-[#F5EBE1] text-[#947659]';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatPrice(price: number): string {
    if (price === undefined || price === null || isNaN(price)) return '$0';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(price);
  }

  getTotalProductsCount(order: OrderSummary): number {
    if (order.totalItems && order.totalItems > 0) return order.totalItems;
    if (Array.isArray(order.products) && order.products.length > 0) {
      return order.products.reduce((acc, p) => acc + (p.quantity || 1), 0);
    }
    return 1;
  }

  getExtraProductsCount(order: OrderSummary): number {
    const total = this.getTotalProductsCount(order);
    return total > 1 ? total - 1 : 0;
  }

  getMainImage(order: OrderSummary): string {
    if (Array.isArray(order.products) && order.products.length > 0) {
      const img = order.products[0]?.image;
      if (img && typeof img === 'string' && img.trim()) return img;
    }
    return '';
  }

  formatOrderNumber(num: string): string {
    return num || '';
  }

  formatPrettyDate(dateString: string): string {
    return this.formatDate(dateString);
  }

  viewOrderDetails(orderId: string) {
    if (!orderId) return;
    this.router.navigate(['/panel/order-details', orderId]);
  }
}
