import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-result-screen',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './result-screen.component.html',
  styleUrls: ['./result-screen.component.css']
})
export class ResultScreenComponent implements OnInit {
  status: 'approved' | 'rejected' | 'pending' | null = null;
  orderId: string | null = null;
  order: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private progress: CheckoutStepperProgressService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.status = (params['status'] as 'approved' | 'rejected' | 'pending') || null;
      this.orderId = params['orderId'] || null;

      if (!this.orderId || !this.status) {
        this.router.navigate(['/']);
        return;
      }

      if (this.status === 'approved') {
        this.progress.completeStep('pago');
      }

      this.loadOrderDetails();
    });
  }

  private async loadOrderDetails() {
    this.isLoading = true;
    try {
      // Usar ordersService para obtener la orden por ID
      // Como no hay un método getOrderById directo en ordersService,
      // podemos hacer una consulta a Supabase usando ordersService.getUserOrders()
      // y filtrar por ID, o consultar directamente Supabase si ordersService tiene supabaseClient.
      // Vamos a ver qué métodos tiene ordersService o implementar una llamada directa a Supabase.
      const supabase = this.authService.getAuthenticatedClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', this.orderId)
        .single();

      if (error || !data) {
        console.error('Error fetching order in result screen:', error);
        this.notificationService.showError('Error', 'No se pudo cargar la información del pedido.');
      } else {
        this.order = data;
      }
    } catch (err) {
      console.error('Error loading order:', err);
    } finally {
      this.isLoading = false;
    }
  }

  get isSucursal(): boolean {
    return this.order?.whatsapp_message && this.order.whatsapp_message.includes('Agencia:');
  }

  get agencyCode(): string | null {
    if (!this.isSucursal) return null;
    return this.order.whatsapp_message.split('Agencia:')[1]?.trim() || null;
  }
}
