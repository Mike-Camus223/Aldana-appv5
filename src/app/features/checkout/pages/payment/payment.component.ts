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
import { AccordionModule } from 'primeng/accordion';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
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
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';
import { ButtonPrimaryDirective } from '../../../../shared/utils/directives/button-primary.directive';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    AccordionModule,
    ChipModule,
    AcordiongenericComponent,
    ToastModule,
    ButtonPrimaryDirective
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  shippingData: ShippingData | null = null;
  cartItems: CartItem[] = [];
  discountData: DiscountData | null = null;
  isProcessing = false;
  activeAccordionPanels: number[] = [0];
  accordionActive: string | null = null;
  accordionWspActive: string | null = null;

  constructor(
    private cartService: CartService,
    private shippingService: ShippingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService,
    private notificationService: NotificationService
  ) {}

  @HostListener('window:beforeunload')
  clearOnUnload() {}

  ngOnInit(): void {
  this.shippingData = this.shippingService.getShippingData();
  if (!this.shippingData) {
    this.router.navigate(['/checkout/shipping']);
    return;
  }

  this.cartService.cartItems$.subscribe((items) => {
    this.cartItems = items.map(item => ({
      ...item,
      variantMainImage: item.variantMainImage?.trim() || undefined
    }));
    this.cdr.detectChanges();
  });

  this.shippingService.discountData$.subscribe((data) => {
    this.discountData = data;
    this.cdr.detectChanges();
  });
}

  toggleAccordion(value: string) {
    this.accordionActive = this.accordionActive === value ? null : value;
  }

  toggleAccordionWsp(value : string) {
    this.accordionWspActive = this.accordionWspActive === value ? null : value;
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  async payWithMercadoPago() {
    if (this.isProcessing) {
      this.notificationService.showInfo('Procesando pago', 'Por favor espera mientras procesamos tu pago', 2000);
      return;
    }

    try {
      // Validaciones iniciales
      if (!this.shippingData) {
        this.notificationService.showError('Datos incompletos', 'Por favor completa tus datos de envío antes de continuar', 4000);
        this.router.navigate(['/checkout/shipping']);
        return;
      }

      if (!this.cartItems || this.cartItems.length === 0) {
        this.notificationService.showError('Carrito vacío', 'No hay productos en tu carrito', 4000);
        this.router.navigate(['/cart']);
        return;
      }

      this.isProcessing = true;
      this.notificationService.showInfo('Procesando', 'Preparando tu pago con Mercado Pago...', 2000);

      // Preparar los items para Mercado Pago
      const items = this.cartItems.map(item => ({
        title: item.name,
        quantity: item.quantity,
        unit_price: this.getDiscountedPrice(item) / item.quantity,
        currency_id: 'ARS', // Moneda argentina
        description: item.name,
        category_id: 'others',
        picture_url: item.variantMainImage || item.image || ''
      }));

      // Validar datos del comprador
      const phoneNumber = this.shippingData.phone.replace(/\D/g, '');
      if (!phoneNumber || phoneNumber.length < 8) {
        this.notificationService.showError('Teléfono inválido', 'Por favor ingresa un número de teléfono válido', 4000);
        this.isProcessing = false;
        return;
      }

      // Preparar los datos del comprador
      const payer = {
        name: this.shippingData.name,
        surname: this.shippingData.surname,
        email: this.shippingData.email,
        phone: {
          area_code: '11', // Código de área para Buenos Aires
          number: phoneNumber
        },
        address: {
          zip_code: this.shippingData.zipCode,
          street_name: this.shippingData.address,
          city_name: this.shippingData.city,
          state_name: this.shippingData.province,
          neighborhood: this.shippingData.neighborhood || ''
        }
      };

      // Crear la preferencia en el backend usando la función dynamic-task (Checkout Pro)
      const response = await fetch(`${environment.SUPABASE_URL}/functions/v1/dynamic-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': environment.SUPABASE_KEY,
          'Authorization': `Bearer ${environment.SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          items: items,
          payer: payer,
          back_urls: {
            success: 'https://aldyapp.web.app/checkout/success',
            failure: 'https://aldyapp.web.app/checkout/failure',
            pending: 'https://aldyapp.web.app/checkout/pending'
          },
          auto_return: 'approved'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error de Supabase:', errorData);
        
        if (response.status === 500) {
          this.notificationService.showError('Error del servidor', 'Hubo un problema al procesar tu pago. Por favor intenta nuevamente.', 5000);
        } else if (response.status === 401) {
          this.notificationService.showError('Autorización inválida', 'Error de autenticación con el servicio de pagos', 4000);
        } else {
          this.notificationService.showError('Error de pago', errorData.error || 'No se pudo procesar tu pago', 4000);
        }
        throw new Error(`Error ${response.status}: ${errorData.error || 'Error al procesar el pago'}`);
      }

      const { init_point, preference_id } = await response.json();
      
      if (!init_point) {
        this.notificationService.showError('Error de configuración', 'No se pudo obtener el enlace de pago', 4000);
        throw new Error('No se recibió el enlace de pago de Mercado Pago');
      }

      // Guardar la información de la orden antes de redirigir
      const orderResult = await this.ordersService.createOrder(
        this.cartItems,
        this.shippingData,
        this.discountData,
        this.subtotal,
        this.total,
        `Mercado Pago - Preference ID: ${preference_id}`
      );

      if (!orderResult.success) {
        console.error('Error al crear la orden:', orderResult.error);
        this.notificationService.showWarn('Aviso', 'El pago fue procesado pero hubo un problema al guardar la orden', 5000);
      }

      this.notificationService.showSuccess('¡Excelente!', 'Serás redirigido a Mercado Pago para completar tu compra', 3000);
      
      // Redirigir a la pasarela de Mercado Pago después de un breve delay
      setTimeout(() => {
        window.location.href = init_point;
      }, 1500);

    } catch (error) {
      console.error('Error crítico en payWithMercadoPago:', error);
      
      // Manejo específico de errores de red
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        this.notificationService.showError('Sin conexión', 'No se pudo conectar con el servicio de pagos. Verifica tu conexión a internet.', 6000);
      } else if (error instanceof Error) {
        this.notificationService.showError('Error de pago', error.message, 5000);
      } else {
        this.notificationService.showError('Error inesperado', 'Ocurrió un problema al procesar tu pago. Por favor intenta nuevamente.', 5000);
      }
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  roundPrice(value: number): number {
    return Math.round(value * 100) / 100;
  }

  getDiscountedPrice(item: CartItem): number {
    if (!this.discountData) return item.price * item.quantity;
    const itemTotal = item.price * item.quantity;
    if (this.discountData.discountType === 'percent') {
      return this.roundPrice(itemTotal * (1 - this.discountData.discountAmount / 100));
    } else {
      const discountPortion =
        (this.discountData.discountAmount * itemTotal) / this.subtotal;
      return this.roundPrice(itemTotal - discountPortion);
    }
  }

  get total(): number {
    if (!this.discountData) return this.roundPrice(this.subtotal);
    let discountValue = 0;
    if (this.discountData.discountType === 'fixed') {
      discountValue = this.discountData.discountAmount;
    } else if (this.discountData.discountType === 'percent') {
      discountValue = this.subtotal * (this.discountData.discountAmount / 100);
    }
    discountValue = this.roundPrice(discountValue);
    return Math.max(this.roundPrice(this.subtotal - discountValue), 0);
  }

  onChangePickupPoint() {
    this.router.navigate(['/checkout/shipping']);
  }

  onChangeBillingData() {
    this.router.navigate(['/checkout/shipping']);
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}
