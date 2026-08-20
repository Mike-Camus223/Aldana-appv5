import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../shared/utils/models/cartItems-model';
import {
  ShippingService,
  ShippingData,
  DiscountData,
} from '../../../../core/services/shipping.service';
import { Router } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { AcordiongenericComponent } from '../../../../shared/components/generic/acordiongeneric/acordiongeneric.component';
import { MercadoPagoService } from '../../../../core/services/mercado-pago.service';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';
import { ButtonPrimaryDirective } from '../../../../shared/utils/directives/button-primary.directive';
import { ModalComponent } from '../../../../shared/components/generic/modal/modal.component';
import { TextareaComponent } from '../../../../shared/components/generic/forms/textarea/textarea.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, ShoppingBag } from 'lucide-angular';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AcordiongenericComponent,
    ButtonPrimaryDirective,
    ModalComponent,
    TextareaComponent,
    LucideAngularModule,
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
      {
        provide: LUCIDE_ICONS,
        multi: true,
        useValue: new LucideIconProvider({
          ShoppingBag,
        }),
      },
    ],
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  shippingData: ShippingData | null = null;
  cartItems: CartItem[] = [];
  discountData: DiscountData | null = null;
  isProcessing = false;
  activeAccordionPanels: number[] = [0];
  accordionActive: string | null = null;
  modalNotesOpen = false;
  modalAddressOpen = false;
  modalPickupOpen = false;
  orderNotes = '';
  isLoading = true;
  showSkeleton = true;
  cardPaymentBrickController: any = null;
  isBrickLoading = false;

  isProduction = environment.production;

  constructor(
    private cartService: CartService,
    private shippingService: ShippingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService,
    private notificationService: NotificationService,
    private mercadoPagoService: MercadoPagoService
  ) {}



  @HostListener('window:beforeunload')
  clearOnUnload() {}

  ngOnInit(): void {
    this.shippingData = this.shippingService.getShippingData();
    if (!this.shippingData) {
      this.router.navigate(['/checkout/envio']);
      return;
    }

    // Si los datos ya están disponibles, ocultar skeleton inmediatamente
    const startTime = Date.now();
    const hideSkeleton = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 300 - elapsed); // Mínimo 300ms para evitar parpadeo
      setTimeout(() => {
        this.showSkeleton = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      }, remaining);
    };

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items.map((item) => ({
        ...item,
        variantMainImage: item.variantMainImage?.trim() || undefined,
      }));
      // Ocultar skeleton cuando los datos estén listos
      if (items.length > 0) {
        hideSkeleton();
      }
      this.cdr.detectChanges();
    });

    this.shippingService.discountData$.subscribe((data) => {
      this.discountData = data;
      this.cdr.detectChanges();
    });

    // Fallback: ocultar skeleton después de 1 segundo máximo
    setTimeout(() => {
      if (this.showSkeleton) {
        this.showSkeleton = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  toggleAccordion(value: string) {
    this.accordionActive = this.accordionActive === value ? null : value;
    if (this.accordionActive === 'payment_mp') {
      this.isBrickLoading = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.initCardPaymentBrick();
      }, 150);
    } else {
      this.cleanupBrick();
    }
  }

  async initCardPaymentBrick() {
    this.cleanupBrick();

    try {
      const mp = this.mercadoPagoService.getMP() || await this.mercadoPagoService.init(environment.MERCADOPAGO_PUBLIC_KEY);
      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          amount: this.total,
          payer: {
            email: this.shippingData?.email || '',
          },
        },
        customization: {
          visual: {
            style: {
              theme: 'default',
            },
          },
        },
        callbacks: {
          onReady: () => {
            this.isBrickLoading = false;
            this.cdr.detectChanges();
          },
          onSubmit: async (formData: any) => {
            return this.processPaymentWithBrick(formData);
          },
          onError: (error: any) => {
            console.error('Error en Mercado Pago Card Brick:', error);
            this.isBrickLoading = false;
            this.notificationService.showError('Error de carga', 'No se pudo cargar el formulario de tarjeta.');
            this.cdr.detectChanges();
          },
        },
      };

      this.cardPaymentBrickController = await bricksBuilder.create(
        'cardPayment',
        'cardPaymentBrick_container',
        settings
      );
    } catch (error) {
      console.error('Error al inicializar el Brick de pagos:', error);
      this.isBrickLoading = false;
      this.cdr.detectChanges();
    }
  }

  private cleanupBrick() {
    if (this.cardPaymentBrickController) {
      try {
        this.cardPaymentBrickController.unmount();
      } catch (e) {
        console.warn('Error desinstalando el Brick de pagos:', e);
      }
      this.cardPaymentBrickController = null;
    }
  }

  async processPaymentWithBrick(formData: any) {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;
      this.notificationService.showInfo('Procesando', 'Registrando tu pedido y validando el pago...', 3000);
      this.cdr.detectChanges();

      // 1. Crear la orden en la base de datos
      const agencyInfo = this.shippingData?.agencyCode ? ` - Agencia: ${this.shippingData.agencyCode}` : '';
      const whatsappMsg = `Mercado Pago Card Brick - Costo Envío: ${this.shippingData?.shippingCost || 0}${agencyInfo}`;

      const orderResult = await this.ordersService.createOrder(
        this.cartItems,
        this.shippingData!,
        this.discountData,
        this.subtotal,
        this.total,
        whatsappMsg
      );

      if (!orderResult.success || !orderResult.orderId) {
        this.notificationService.showError('Error al crear orden', orderResult.error || 'No se pudo registrar tu pedido.');
        this.isProcessing = false;
        this.cdr.detectChanges();
        return;
      }

      // 2. Procesar el pago llamando a la Edge Function process-payment
      const response = await fetch(`${environment.SUPABASE_URL}/functions/v1/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': environment.SUPABASE_KEY,
          'Authorization': `Bearer ${environment.SUPABASE_KEY}`
        },
        body: JSON.stringify({
          orderId: orderResult.orderId,
          token: formData.token,
          paymentMethodId: formData.payment_method_id,
          installments: formData.installments,
          payerEmail: formData.payer.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al procesar cobro' }));
        this.notificationService.showError('Pago rechazado', errorData.error || 'Hubo un error al procesar el pago.');
        
        // Redirigir a pantalla de resultado fallido
        setTimeout(() => {
          this.router.navigate(['/checkout/resultado'], {
            queryParams: { status: 'rejected', orderId: orderResult.orderId }
          });
        }, 1500);
        return;
      }

      const paymentResult = await response.json();

      // 3. Procesar el resultado
      if (paymentResult.status === 'approved') {
        this.cartService.clearCart();
        this.notificationService.showSuccess('¡Pago Aprobado!', 'Tu pedido ha sido registrado con éxito.');
        setTimeout(() => {
          this.router.navigate(['/checkout/resultado'], {
            queryParams: { status: 'approved', orderId: orderResult.orderId }
          });
        }, 1000);
      } else {
        // Puede ser pending, in_process, etc.
        this.cartService.clearCart(); // Limpiamos carrito porque la orden ya existe en DB
        this.notificationService.showInfo('Pago Pendiente', 'Tu pago está en proceso de validación.');
        setTimeout(() => {
          this.router.navigate(['/checkout/resultado'], {
            queryParams: { status: 'pending', orderId: orderResult.orderId }
          });
        }, 1000);
      }

    } catch (error: any) {
      console.error('Error procesando pago con Brick:', error);
      this.notificationService.showError('Error de red', 'No se pudo conectar con el servidor de pagos.');
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.cleanupBrick();
  }

  get subtotal(): number {
    return this.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  roundPrice(value: number): number {
    return Math.round(value * 100) / 100;
  }

  getDiscountedPrice(item: CartItem): number {
    if (!this.discountData) return item.price * item.quantity;
    const itemTotal = item.price * item.quantity;
    if (this.discountData.discountType === 'percent') {
      return this.roundPrice(
        itemTotal * (1 - this.discountData.discountAmount / 100)
      );
    } else {
      const discountPortion =
        (this.discountData.discountAmount * itemTotal) / this.subtotal;
      return this.roundPrice(itemTotal - discountPortion);
    }
  }

  get total(): number {
    const shippingCost = this.shippingData?.shippingCost || 0;
    if (!this.discountData) return this.roundPrice(this.subtotal + shippingCost);
    let discountValue = 0;
    if (this.discountData.discountType === 'fixed') {
      discountValue = this.discountData.discountAmount;
    } else if (this.discountData.discountType === 'percent') {
      discountValue = this.subtotal * (this.discountData.discountAmount / 100);
    }
    discountValue = this.roundPrice(discountValue);
    return Math.max(this.roundPrice(this.subtotal + shippingCost - discountValue), 0);
  }

  onChangePickupPoint() {
    this.router.navigate(['/checkout/envio']);
  }

  onChangeBillingData() {
    this.router.navigate(['/checkout/envio']);
  }

  closeNotesModal() {
    this.modalNotesOpen = false;
  }

  saveNotes() {
    this.modalNotesOpen = false;
    this.cdr.detectChanges();
  }

  closePickupModal() {
    this.modalPickupOpen = false;
  }

  selectPickupOption() {
    this.modalPickupOpen = false;
    this.cdr.detectChanges();
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  getColorHex(color: string): string {
    if (!color) return '';
    if (color.startsWith('#')) return color;
    const map: Record<string, string> = {
      'negro': '#000000',
      'blanco': '#ffffff',
      'rojo': '#e11d48',
      'azul': '#2563eb',
      'verde': '#16a34a',
      'amarillo': '#ca8a04',
      'rosa': '#db2777',
      'gris': '#4b5563',
      'naranja': '#ea580c',
      'marrón': '#78350f',
      'marron': '#78350f',
      'beige': '#f5f5dc',
      'celeste': '#38bdf8',
      'lila': '#c084fc',
      'violeta': '#7c3aed',
    };
    return map[color.toLowerCase().trim()] || color;
  }

  // Método para testing del skeleton loader
  simulateLoading(): void {
    this.showSkeleton = true;
    this.isLoading = true;
    
    setTimeout(() => {
      this.showSkeleton = false;
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 300);
  }
}
