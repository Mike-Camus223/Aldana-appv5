import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { getPaymentRejectionInfo, PaymentRejectionInfo } from '../../../../shared/utils/helpers/payment-status-helper';
import {
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Package,
  MessageCircle,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  ArrowRight,
  ShieldAlert
} from 'lucide-angular';

@Component({
  selector: 'app-result-screen',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './result-screen.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./result-screen.component.css'],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ShoppingBag,
        CheckCircle2,
        AlertCircle,
        Clock,
        RotateCcw,
        Package,
        MessageCircle,
        ArrowRight,
        ShieldAlert
      })
    }
  ]
})
export class ResultScreenComponent implements OnInit {
  status: 'approved' | 'rejected' | 'pending' | null = null;
  statusDetail: string | null = null;
  orderId: string | null = null;
  order: any = null;
  paymentRecord: any = null;
  rejectionInfo: PaymentRejectionInfo | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
    private progress: CheckoutStepperProgressService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.status = (params['status'] as 'approved' | 'rejected' | 'pending') || null;
      this.statusDetail = params['detail'] || null;
      this.orderId = params['orderId'] || null;

      if (!this.orderId || !this.status) {
        this.router.navigate(['/']);
        return;
      }

      if (this.status === 'approved') {
        this.progress.completeStep('pago');
      }

      // Generar info inicial con lo recibido por URL
      if (this.status === 'rejected') {
        this.rejectionInfo = getPaymentRejectionInfo(this.statusDetail || '');
      }

      this.loadOrderDetails();
    });
  }

  private async loadOrderDetails() {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const supabase = this.authService.getAuthenticatedClient();
      
      // 1. Obtener datos de la orden
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', this.orderId)
        .single();

      if (error || !data) {
        console.error('Error fetching order in result screen:', error);
      } else {
        this.order = data;
      }

      // 2. Obtener el último registro de pago si existe para afinar el motivo
      const { data: payment } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', this.orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payment) {
        this.paymentRecord = payment;
        const mpDetail = payment.metadata?.status_detail || payment.status || this.statusDetail;
        if (this.status === 'rejected') {
          this.rejectionInfo = getPaymentRejectionInfo(mpDetail, this.order?.whatsapp_message);
        }
      }
    } catch (err) {
      console.error('Error loading order:', err);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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
