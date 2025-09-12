import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArrowDownToLine, Book, BookCheck, Check, Headset, House, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, NotepadText, Package, Truck } from 'lucide-angular';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { Order } from '../../../utils/models/order.interface';

interface Step {
  id: number;
  label: string;
  date: string;
  active: boolean;
  completed: boolean;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Check,
        NotepadText,
        BookCheck,
        Book,
        Package,
        Truck,
        House,
        Headset,
        ArrowDownToLine
      })
    }
  ],
  templateUrl: './order-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  error: string | null = null;
  steps: Step[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(orderId);
    } else {
      this.error = 'ID de orden no válido';
      this.loading = false;
    }
  }

  async loadOrderDetails(orderId: string) {
    this.loading = true;
    this.error = null;

    try {
      const result = await this.ordersService.getUserOrderById(orderId);
      
      if (result.success && result.order) {
        this.order = result.order;
        this.generateSteps();
      } else {
        this.error = result.error || 'Error al cargar los detalles de la orden';
      }
    } catch (error: any) {
      this.error = 'Error inesperado al cargar la orden';
      console.error('Error loading order details:', error);
    } finally {
      this.loading = false;
    }
  }

  generateSteps() {
    if (!this.order) return;

    const status = this.order.status;
    
    this.steps = [
      { 
        id: 1, 
        label: 'Pedido confirmado', 
        date: this.formatDate(this.order.created_at), 
        time: this.formatTime(this.order.created_at), 
        active: true, 
        completed: true, 
        icon: 'book' 
      },
      { 
        id: 2, 
        label: 'Pedido aceptado', 
        date: this.order.confirmed_at ? this.formatDate(this.order.confirmed_at) : '—', 
        time: this.order.confirmed_at ? this.formatTime(this.order.confirmed_at) : '—', 
        active: status !== 'pending', 
        completed: status !== 'pending', 
        icon: 'book-check' 
      },
      { 
        id: 3, 
        label: 'En preparación', 
        date: status === 'in_transit' || status === 'completed' ? this.formatDate(this.order.updated_at) : '—', 
        time: status === 'in_transit' || status === 'completed' ? this.formatTime(this.order.updated_at) : '—', 
        active: status === 'in_transit' || status === 'completed', 
        completed: status === 'in_transit' || status === 'completed', 
        icon: 'package' 
      },
      { 
        id: 4, 
        label: 'En camino', 
        date: status === 'in_transit' ? this.formatDate(this.order.updated_at) : (this.order.estimated_delivery_at ? this.formatDate(this.order.estimated_delivery_at) : '—'), 
        time: status === 'in_transit' ? this.formatTime(this.order.updated_at) : '—', 
        active: status === 'in_transit', 
        completed: status === 'completed', 
        icon: 'truck' 
      },
      { 
        id: 5, 
        label: 'Entregado en domicilio', 
        date: this.order.delivered_at ? this.formatDate(this.order.delivered_at) : '—', 
        time: this.order.delivered_at ? this.formatTime(this.order.delivered_at) : '—', 
        active: false, 
        completed: status === 'completed', 
        icon: 'house' 
      },
    ];

    // Si está rechazado, marcar solo el primer paso como completado
    if (status === 'rejected') {
      this.steps.forEach((step, index) => {
        if (index > 0) {
          step.completed = false;
          step.active = false;
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }

  getStatusLabel(): string {
    if (!this.order) return '';
    
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in_transit': 'En camino',
      'completed': 'Entregado',
      'rejected': 'Cancelado'
    };
    return statusMap[this.order.status] || this.order.status;
  }

  getStatusClass(): string {
    if (!this.order) return '';
    
    const classMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'in_transit': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return classMap[this.order.status] || 'bg-gray-100 text-gray-700';
  }

  getFullAddress(): string {
    if (!this.order) return '';
    
    const parts = [
      this.order.address_street,
      this.order.address_number,
      this.order.address_apartment,
      this.order.city,
      this.order.province
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  getCustomerName(): string {
    if (!this.order) return '';
    return `${this.order.customer_first_name} ${this.order.customer_last_name}`;
  }

  goBack() {
    this.router.navigate(['/user-panel/orders-history']);
  }

  downloadInvoice() {
    // Implementar descarga de factura
    console.log('Descargar factura para orden:', this.order?.id);
  }

  contactSupport() {
    // Implementar contacto con soporte
    console.log('Contactar soporte para orden:', this.order?.id);
  }
}
