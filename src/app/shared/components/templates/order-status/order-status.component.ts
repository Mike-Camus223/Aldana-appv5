import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ArrowDownToLine, Book, BookCheck, Check, Headset, House, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, NotepadText, Package, Truck } from 'lucide-angular';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { OrderModel, OrderProduct } from '../../../../shared/utils/models/order.interface';
import { AuthService } from '../../../../core/services/auth/auth.service';

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
export class OrderStatusComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  loading = true;
  error: string | null = null;
  steps: Step[] = [];
  private realtimeChannel: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Manejar el parámetro de ruta inicial
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(orderId);
    } else {
      this.error = 'ID de orden no válido';
      this.loading = false;
    }

    // Suscribirse a cambios en los parámetros de ruta
    this.route.paramMap.subscribe(params => {
      const newOrderId = params.get('id');
      if (newOrderId) {
        this.loadOrderDetails(newOrderId);
      }
    });
  }

  async loadOrderDetails(orderId: string) {
    this.loading = true;
    this.error = null;

    try {
      const result = await this.ordersService.getUserOrderById(orderId);
      
      if (result.success && result.order) {
        this.order = result.order;
        this.updateSteps();
        this.setupRealtime(orderId);
      } else {
        this.error = result.error || 'Error al cargar los detalles de la orden';
      }
    } catch (error: any) {
      this.error = 'Error inesperado al cargar la orden';
      console.error('Error loading order details:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private setupRealtime(orderId: string) {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    const supabase = this.authService.getAuthenticatedClient();
    this.realtimeChannel = supabase
      .channel(`order-updates-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          console.log('🔄 Actualización en tiempo real recibida:', payload.new);
          this.order = payload.new;
          this.updateSteps();
          this.cdr.detectChanges();
        }
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
  }

  private updateSteps() {
    if (!this.order) return;
  
    const orderDate = new Date(this.order.created_at);
    const formattedDate = this.formatDate(this.order.created_at);
    const formattedTime = this.formatTime(this.order.created_at);
  
    // Define all possible steps in order
    const allSteps: Step[] = [
      {
        id: 1,
        label: 'Pedido confirmado',
        date: formattedDate,
        time: formattedTime,
        active: true,
        completed: true,
        icon: 'BookCheck'
      },
      {
        id: 2,
        label: 'Pedido aceptado',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'Book'
      },
      {
        id: 3,
        label: 'En preparación',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'Package'
      },
      {
        id: 4,
        label: 'En camino',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'Truck'
      },
      {
        id: 5,
        label: 'Entregado en domicilio',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'House'
      }
    ];
  
    // Update steps based on order status
    switch (this.order.status) {
      case 'pending':
        // Only first step is completed
        this.steps = allSteps.map((step, index) => ({
          ...step,
          active: index === 0,
          completed: index === 0
        }));
        break;
        
      case 'in_transit':
        // First 4 steps completed, 4th active
        this.steps = allSteps.map((step, index) => {
          if (index < 3) {
            return { ...step, completed: true, active: false };
          } else if (index === 3) {
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
        // All steps completed
        this.steps = allSteps.map((step, index) => ({
          ...step,
          completed: true,
          active: false,
          date: index === 4 ? formattedDate : step.date,
          time: index === 4 ? formattedTime : step.time
        }));
        break;
        
      case 'rejected':
        // Only first step shown, marked as rejected
        this.steps = [{
          ...allSteps[0],
          label: 'Pedido rechazado',
          completed: true,
          active: false
        }];
        break;
    }
    
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
    this.router.navigate(['/orders-history']);
  }

  downloadInvoice() {
    if (!this.order) return;
    
    // In a real implementation, you would call a service to generate/download the invoice
    console.log('Downloading invoice for order:', this.order.id);
    // Example: this.orderService.downloadInvoice(this.order.id).subscribe(...);
    
    // For demo purposes, we'll show an alert
    alert('La factura se está generando y se descargará automáticamente.');
  }

  contactSupport() {
    if (!this.order) return;
    
    // In a real implementation, you might open a support chat or redirect to a contact form
    console.log('Contacting support for order:', this.order.id);
    
    // For demo purposes, we'll open WhatsApp with a pre-filled message
    const phoneNumber = '+5491122334455'; // Replace with your support number
    const message = `Hola, necesito ayuda con mi pedido #${this.order.order_number}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  trackOrder(): void {
    if (!this.order?.wamid) {
      console.warn('No tracking information available for this order');
      return;
    }
    
    console.log('Tracking order:', this.order.wamid);
    // Example: window.open(`https://tracking.example.com/?id=${this.order.wamid}`, '_blank');
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

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'in_transit' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
  total_final: number;
  subtotal: number;
  discount_applied?: number;
  discount_code?: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone?: string;
  customer_notes?: string;
  seller_notes?: string;
  address_street: string;
  address_number: string;
  address_apartment?: string;
  city: string;
  province: string;
  payment_method?: 'mercadopago' | 'transfer' | 'cash';
  payment_status?: 'pending' | 'approved' | 'rejected';
  wamid?: string; // For WhatsApp message ID
  estimated_delivery_at?: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    color?: string;
    size?: string;
  }>;
}
