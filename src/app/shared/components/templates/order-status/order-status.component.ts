import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArrowDownToLine, Book, BookCheck, Check, Headset, House, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, NotepadText, Package, Truck } from 'lucide-angular';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { Order, OrderProduct } from '../../../../shared/utils/models/order.interface';

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
    private ordersService: OrdersService,
    private cdr: ChangeDetectorRef
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
        this.updateSteps();
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

  private updateSteps() {
    if (!this.order) return;
  
    const orderDate = new Date(this.order.created_at);
    const formattedDate = orderDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  
    // Create a new array for each status
    let steps: Step[] = [
      {
        id: 1,
        label: 'Pedido realizado',
        date: formattedDate,
        time: formattedTime,
        active: false,
        completed: true,
        icon: 'NotepadText'
      },
      {
        id: 2,
        label: 'Pedido confirmado',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'BookCheck'
      },
      {
        id: 3,
        label: 'En camino',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'Truck'
      },
      {
        id: 4,
        label: 'Entregado',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'House'
      }
    ];
  
    switch (this.order.status) {
      case 'pending':
        steps = [{
          ...steps[0],
          completed: true,
          active: false
        }];
        break;
        
      case 'in_transit':
        steps = steps.map((step, index) => {
          if (index < 2) {
            return { ...step, completed: true, active: false };
          } else if (index === 2) {
            return {
              ...step,
              completed: true,
              active: true,
              date: formattedDate,
              time: formattedTime
            };
          }
          return step;
        });
        break;
        
      case 'completed':
        steps = steps.map(step => ({
          ...step,
          completed: true,
          active: false,
          date: step.id === 4 ? formattedDate : step.date,
          time: step.id === 4 ? formattedTime : step.time
        }));
        break;
        
      case 'rejected':
        steps = [{
          ...steps[0],
          completed: true,
          active: false
        }];
        break;
    }
  
    this.steps = steps;
    this.cdr.detectChanges();
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

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in_transit': 'En camino',
      'completed': 'Completado',
      'rejected': 'Rechazado'
    };
    return statusLabels[status] || status;
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

  goBack(): void {
    this.router.navigate(['/panel-control/mis-pedidos']);
  }

  downloadInvoice() {
    // Implementar descarga de factura
    console.log('Descargar factura para orden:', this.order?.id);
  }

  contactSupport() {
    // Implementar contacto con soporte
    console.log('Contactar soporte para orden:', this.order?.id);
  }

  trackOrder(): void {
    if (!this.order?.wamid) {
      console.warn('No tracking information available for this order');
      return;
    }
    
    // Here you would typically open a tracking URL or show a modal
    console.log('Tracking order:', this.order.wamid);
  }

  getTotal(): number {
    return this.order?.total_final || 0;
  }

  getVariantInfo(product: OrderProduct): string {
    const parts = [];
    if (product.color) parts.push(product.color);
    if (product.size) parts.push(product.size);
    return parts.join(' • ');
  }
}
