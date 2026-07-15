import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-orders-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders-management.component.html',
  styleUrls: ['./orders-management.component.css']
})
export class OrdersManagementComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  isLoading = true;
  expandedOrderId: string | null = null;
  
  // Filtros
  searchQuery = '';
  selectedStatusTab: string = 'all';

  constructor(
    private ordersService: OrdersService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  async loadOrders() {
    this.isLoading = true;
    try {
      const result = await this.ordersService.getAllOrdersAdmin();
      if (result.success && result.orders) {
        this.orders = result.orders;
        this.applyFilters();
      } else {
        this.notificationService.showError('Error', result.error || 'No se pudieron cargar las órdenes.');
      }
    } catch (err) {
      console.error('Error loading admin orders:', err);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilters() {
    let temp = [...this.orders];

    // Filtro por pestaña de estado
    if (this.selectedStatusTab !== 'all') {
      temp = temp.filter(o => o.status === this.selectedStatusTab);
    }

    // Filtro por buscador (Nº orden o cliente)
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      temp = temp.filter(o => 
        o.order_number.toLowerCase().includes(query) ||
        `${o.customer_first_name} ${o.customer_last_name}`.toLowerCase().includes(query) ||
        o.customer_email.toLowerCase().includes(query)
      );
    }

    this.filteredOrders = temp;
  }

  selectStatusTab(status: string) {
    this.selectedStatusTab = status;
    this.applyFilters();
  }

  toggleExpandOrder(orderId: string) {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'preparing': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'shipped': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'delivered': return 'bg-green-50 text-green-700 border border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'En Preparación';
      case 'shipped': return 'Despachado';
      case 'delivered': return 'Entregado';
      case 'rejected': return 'Cancelado';
      default: return status;
    }
  }

  // Acciones administrativas
  async transitionStatus(order: any, newStatus: string, actionComment: string) {
    try {
      this.isLoading = true;
      const result = await this.ordersService.updateOrderStatusAdmin(
        order.id,
        order.status,
        newStatus,
        actionComment
      );

      if (result.success) {
        this.notificationService.showSuccess('Estado actualizado', `La orden #${order.order_number} pasó a: ${this.getStatusLabel(newStatus)}`);
        
        // Si pasa a preparando (pago aprobado), llamamos a descontar stock por seguridad
        // si no se hizo antes, o al endpoint de importar envío de Correo Argentino
        if (newStatus === 'preparing') {
          // Descontar stock atómicamente si el pago fue aprobado manualmente
          const supabase = this.authService.getAuthenticatedClient();
          await supabase.rpc('deduct_stock_for_order', { p_order_id: order.id });
          
          // Importar envío en Correo Argentino
          fetch(`${environment.SUPABASE_URL}/functions/v1/correo-argentino/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': environment.SUPABASE_KEY,
              'Authorization': `Bearer ${environment.SUPABASE_KEY}`
            },
            body: JSON.stringify({ orderId: order.id })
          }).catch(e => console.error('Error importando envío en Correo Argentino:', e));
        }

        // Si pasa a despachado (shipped), llamamos a importar envío si no se hizo antes
        if (newStatus === 'shipped') {
          fetch(`${environment.SUPABASE_URL}/functions/v1/correo-argentino/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': environment.SUPABASE_KEY,
              'Authorization': `Bearer ${environment.SUPABASE_KEY}`
            },
            body: JSON.stringify({ orderId: order.id })
          }).catch(e => console.error('Error al importar envío al despachar:', e));
        }

        await this.loadOrders();
      } else {
        this.notificationService.showError('Error', result.error || 'No se pudo actualizar el estado.');
      }
    } catch (err) {
      console.error('Error transitioning order status:', err);
    } finally {
      this.isLoading = false;
    }
  }

  isSucursal(order: any): boolean {
    return order.whatsapp_message && order.whatsapp_message.includes('Agencia:');
  }

  getAgencyCode(order: any): string | null {
    if (!this.isSucursal(order)) return null;
    return order.whatsapp_message.split('Agencia:')[1]?.trim() || null;
  }
}
