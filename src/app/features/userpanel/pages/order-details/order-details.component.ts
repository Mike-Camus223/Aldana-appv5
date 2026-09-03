import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { InvoiceService } from '../../../../core/services/invoice/invoice.service';
import { OrderModel, OrderProduct, Order } from '../../../../shared/models/order.interface';
import { AuthService } from '../../../../core/auth/auth.service';
import { getPaymentRejectionInfo, PaymentRejectionInfo } from '../../../../shared/utils/helpers/payment-status-helper';

export interface Step {
  id: number;
  label: string;
  date: string;
  active: boolean;
  completed: boolean;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-order-details, app-order-status',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  paymentRecord: any = null;
  rejectionInfo: PaymentRejectionInfo | null = null;
  loading = true;
  error: string | null = null;
  steps: Step[] = [];
  private realtimeChannel: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(orderId);
    } else {
      this.error = 'ID de pedido no válido';
      this.loading = false;
    }

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
        this.order = result.order as Order;
        
        // Obtener datos del pago si existe
        await this.loadPaymentDetails(orderId);
        
        this.updateSteps();
        this.setupRealtime(orderId);
      } else {
        this.error = result.error || 'Error al cargar los detalles del pedido';
      }
    } catch (error: any) {
      this.error = 'Error inesperado al cargar el pedido';
      console.error('Error loading order details:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadPaymentDetails(orderId: string) {
    try {
      const supabase = this.authService.getAuthenticatedClient();
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payment) {
        this.paymentRecord = payment;
        const mpDetail = payment.metadata?.status_detail || payment.status;
        this.rejectionInfo = getPaymentRejectionInfo(mpDetail, this.order?.whatsapp_message);
      } else if (this.order?.status === 'rejected') {
        this.rejectionInfo = getPaymentRejectionInfo('', this.order?.whatsapp_message);
      }
    } catch (e) {
      console.warn('Error fetching payment record:', e);
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
          filter: `id=eq.${orderId}`},
        (payload: any) => {
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
  
    const formattedDate = this.formatDate(this.order.created_at);
    const formattedTime = this.formatTime(this.order.created_at);
  
    // Pasos del proceso logístico
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
        label: 'En preparación',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'Package'
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
        label: this.isSucursal ? 'Listo para retirar en sucursal' : 'Entregado en domicilio',
        date: '',
        time: '',
        active: false,
        completed: false,
        icon: 'House'
      }
    ];
  
    switch (this.order.status) {
      case 'pending':
        this.steps = allSteps.map((step, index) => ({
          ...step,
          active: index === 0,
          completed: index === 0
        }));
        break;

      case 'preparing':
        this.steps = allSteps.map((step, index) => ({
          ...step,
          completed: index <= 1,
          active: index === 1
        }));
        break;
        
      case 'in_transit':
        this.steps = allSteps.map((step, index) => ({
          ...step,
          completed: index <= 2,
          active: index === 2
        }));
        break;
        
      case 'completed':
        this.steps = allSteps.map(step => ({
          ...step,
          completed: true,
          active: false
        }));
        break;
        
      case 'rejected':
        this.steps = [];
        break;
    }
    
    this.cdr.detectChanges();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(price || 0);
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'Pago pendiente',
      'preparing': 'En preparación',
      'in_transit': 'En camino',
      'completed': 'Entregado',
      'rejected': 'Pago rechazado'
    };
    return statusLabels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-[#E2EAE0] text-[#556F52]';
      case 'preparing':
      case 'pending':
        return 'bg-[#F5EBE1] text-[#947659]';
      case 'in_transit':
        return 'bg-[#E3EAF2] text-[#4A6785]';
      case 'rejected':
        return 'bg-[#FBEAEA] text-[#9E5252]';
      default:
        return 'bg-[#F5EBE1] text-[#947659]';
    }
  }

  get isSucursal(): boolean {
    return !!(this.order?.whatsapp_message && this.order.whatsapp_message.includes('Agencia:'));
  }

  get agencyCode(): string | null {
    if (!this.isSucursal || !this.order?.whatsapp_message) return null;
    return this.order.whatsapp_message.split('Agencia:')[1]?.trim() || null;
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  async downloadInvoice(): Promise<void> {
    if (!this.order?.id) return;
    try {
      await this.invoiceService.downloadInvoice(this.order.id);
    } finally {
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  contactSupport() {
    if (!this.order) return;
    const phoneNumber = '5491122334455';
    const message = `Hola, tengo una consulta sobre mi pedido #${this.order.order_number}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/panel/orders-history']);
  }

  getVariantInfo(product: any): string {
    const parts = [];
    if (product.color) parts.push(product.color);
    if (product.size) parts.push(product.size);
    return parts.join(' • ');
  }
}

export { OrderDetailsComponent as OrderStatusComponent };
