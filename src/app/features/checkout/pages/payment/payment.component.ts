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
import { ButtonPrimaryDirective } from '../../../../shared/utils/directives/button-primary.directive';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../shared/utils/models/cartItems-model';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import {
  ShippingService,
  ShippingData,
  DiscountData,
} from '../../../../core/services/shipping.service';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { OrdersService } from '../../../../core/services/orders/orders.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    AccordionModule,
    ChipModule,
    ButtonPrimaryDirective,
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

  constructor(
    private cartService: CartService,
    private progress: CheckoutStepperProgressService,
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


  ngAfterViewInit(): void {}

  ngOnDestroy(): void {}

  // MERCADOPAGO METHOD - TEMPORARILY COMMENTED OUT
  // async pagar() {
  //   if (this.isProcessing) return;
  //   this.isProcessing = true;

  //   try {
  //     const response = await fetch(`${environment.SUPABASE_URL}/functions/v1/dynamic-task`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         apikey: environment.SUPABASE_KEY,
  //         Authorization: `Bearer ${environment.SUPABASE_KEY}`,
  //       },
  //       body: JSON.stringify({
  //         items: this.cartItems.map((item) => ({
  //           title: item.name,
  //           quantity: item.quantity,
  //           unit_price: this.getDiscountedPrice(item) / item.quantity,
  //         })),
  //         payer: {
  //           email: this.shippingData?.email || '',
  //         },
  //         back_urls: {
  //           success: 'https://aldyapp.web.app/checkout/success',
  //           failure: 'https://aldyapp.web.app/checkout/failure',
  //           pending: 'https://aldyapp.web.app/checkout/pending',
  //         },
  //         auto_return: 'approved',
  //       }),
  //     });

  //     if (response.ok) {
  //       const { init_point } = await response.json();
  //       window.location.href = init_point;
  //     }
  //   } finally {
  //     this.isProcessing = false;
  //   }
  // }

  async payWithWhatsApp() {
    if (this.isProcessing) return;
    if (!this.shippingData || this.cartItems.length === 0) {
      alert('Error: Datos de envío o carrito vacío');
      return;
    }

    this.isProcessing = true;

    try {
      // Generate WhatsApp message
      const productsList = this.cartItems.map(item => 
        `- ${item.name} (cantidad: ${item.quantity}, precio: $${this.getDiscountedPrice(item).toFixed(2)})`
      ).join(', ');

      const whatsappMessage = `Hola soy ${this.shippingData.name} ${this.shippingData.surname}, deseo comprar estos productos: ${productsList}.El total de todo es: $${this.total.toFixed(2)}`;

      // Create order in database
      const orderResult = await this.ordersService.createOrder(
        this.cartItems,
        this.shippingData,
        this.discountData,
        this.subtotal,
        this.total,
        whatsappMessage
      );

      if (!orderResult.success) {
        alert(`Error al crear la orden: ${orderResult.error}`);
        return;
      }

      // Add order ID to WhatsApp message
      const finalMessage = `${whatsappMessage}. Pedido #${orderResult.orderId}`;
      const encodedMessage = encodeURIComponent(finalMessage);
      const whatsappUrl = `https://wa.me/15556080222?text=${encodedMessage}`;

      // Clear cart after successful order creation
      this.cartService.clearCart();
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');
      
      // Navigate to success page or home
      this.router.navigate(['/']);
      
    } catch (error: any) {
      console.error('Error in payWithWhatsApp:', error);
      alert('Error al procesar el pedido. Por favor intenta nuevamente.');
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

  // Helper method to format currency for WhatsApp message
  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}
