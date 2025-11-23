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

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    AccordionModule,
    ChipModule,
    AcordiongenericComponent
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

  constructor(
    private cartService: CartService,
    private shippingService: ShippingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService
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

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  async payWithMercadoPago() {
    if (this.isProcessing) return;
    if (!this.shippingData || this.cartItems.length === 0) {
      alert('Error: Datos de envío o carrito vacío');
      return;
    }

    this.isProcessing = true;

    try {
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

      // Preparar los datos del comprador
      const payer = {
        name: this.shippingData.name,
        surname: this.shippingData.surname,
        email: this.shippingData.email,
        phone: {
          area_code: '11', // Código de área para Buenos Aires
          number: this.shippingData.phone.replace(/\D/g, '') // Remover caracteres no numéricos
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

      console.log('Enviando datos a Supabase:', {
        items,
        payer,
        back_urls: {
          success: 'https://aldyapp.web.app/checkout/success',
          failure: 'https://aldyapp.web.app/checkout/failure',
          pending: 'https://aldyapp.web.app/checkout/pending'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de Supabase:', response.status, errorText);
        throw new Error(`Error al crear la preferencia de pago: ${response.status} - ${errorText}`);
      }

      const { init_point, preference_id } = await response.json();
      
      // Guardar la información de la orden antes de redirigir
      await this.ordersService.createOrder(
        this.cartItems,
        this.shippingData,
        this.discountData,
        this.subtotal,
        this.total,
        `Mercado Pago - Preference ID: ${preference_id}`
      );

      // Redirigir a la pasarela de Mercado Pago
      window.location.href = init_point;

    } catch (error) {
      console.error('Error en payWithMercadoPago:', error);
      alert(`Error al procesar el pago con Mercado Pago: ${(error as Error).message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  async payWithWhatsApp() {
    if (this.isProcessing) return;
    if (!this.shippingData || this.cartItems.length === 0) {
      alert('Error: Datos de envío o carrito vacío');
      return;
    }

    this.isProcessing = true;

    try {
      // 1. Generar el mensaje de texto para WhatsApp
      let message = '¡Hola! Quisiera hacer el siguiente pedido:\n\n';
      this.cartItems.forEach(item => {
        message += `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
      });
      message += `\nSubtotal: $${this.subtotal.toFixed(2)}`;
      if (this.discountData) {
        message += `\nDescuento: -$${this.discountData.discountAmount.toFixed(2)}`;
      }
      message += `\n*Total: $${this.total.toFixed(2)}*\n\n`;
      message += `Datos de envío:\n`;
      message += `${this.shippingData.name} ${this.shippingData.surname}\n`;
      message += `${this.shippingData.address}, ${this.shippingData.city}\n`;

      // 2. Crear la orden en la base de datos
      const orderResult = await this.ordersService.createOrder(
        this.cartItems,
        this.shippingData,
        this.discountData,
        this.subtotal,
        this.total,
        message // Guardamos el mensaje en la BD
      );

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'No se pudo crear la orden.');
      }
      // 3. Redirigir al cliente a WhatsApp
      const sellerPhoneNumber = '15556080222'; // Reemplaza con el número de WhatsApp del vendedor
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${sellerPhoneNumber}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');

      // 4. Limpiar el carrito y redirigir
      this.cartService.clearCart();
      this.router.navigate(['/checkout/success']);

    } catch (error) {
      console.error('Error en payWithWhatsApp:', error);
      alert(`Error al procesar el pedido: ${(error as Error).message}`);
    } finally {
      this.isProcessing = false;
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
