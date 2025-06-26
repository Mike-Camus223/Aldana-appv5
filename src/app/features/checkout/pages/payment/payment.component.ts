import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
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
import { MercadoPagoService } from '../../../../core/services/mercado-pago.service';

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
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  shippingData: ShippingData | null = null;
  cartItems: CartItem[] = [];
  discountData: DiscountData | null = null;
  cardForm: any = null;
  cardFormMounted = false;
  formId = 'paymentForm-' + Math.random().toString(36).substring(2, 10);

  constructor(
    private cartService: CartService,
    private progress: CheckoutStepperProgressService,
    private shippingService: ShippingService,
    private router: Router,
    private mpService: MercadoPagoService
  ) {}

  @HostListener('window:beforeunload')
  clearOnUnload() {
    this.destroyCardForm();
  }

  ngOnInit(): void {
    this.shippingData = this.shippingService.getShippingData();
    if (!this.shippingData) {
      this.router.navigate(['/checkout/shipping']);
      return;
    }

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
    });

    this.shippingService.discountData$.subscribe((data) => {
      this.discountData = data;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeCardForm(), 100);
  }

  ngOnDestroy(): void {
    this.destroyCardForm();
  }

  destroyCardForm() {
    if (this.cardForm?.destroy) {
      this.cardForm.destroy();
      console.log(' cardForm destruido correctamente');
    }
    this.cardForm = null;
    this.cardFormMounted = false;
  }

  async initializeCardForm() {
    if (this.cardFormMounted) {
      console.warn(' cardForm ya está montado.');
      return;
    }

    this.destroyCardForm();

    try {
      const mp = await this.mpService.init(
        'TEST-bd08415d-499e-4579-b7f8-9419b0f84d15'
      );

      const total = this.total;

      this.cardForm = mp.cardForm({
        amount: total.toFixed(2),
        autoMount: true,
        form: {
          id: this.formId,
          cardholderName: { id: 'cardholderName', placeholder: 'Titular de tarjeta' },
          cardNumber: { id: 'cardNumber', placeholder: 'Número de tarjeta' },
          expirationDate: { id: 'expirationDate', placeholder: 'MM/AA' },
          securityCode: { id: 'securityCode', placeholder: 'CVV' },
          installments: { id: 'installments' },
          identificationType: { id: 'identificationType' },
          identificationNumber: { id: 'identificationNumber', placeholder: 'Número de documento' },
          issuer: { id: 'issuer' },
          email: { id: 'email', placeholder: 'Correo electrónico' },
        },
        callbacks: {
          onFormMounted: (error?: any) => {
            if (error) {
              console.error('❌ Error al montar cardForm:', error);
              return;
            }
            this.cardFormMounted = true;
            console.log('✅ MercadoPago cardForm montado correctamente');
            
            this.fillSavedData();
          },
          onSubmit: (event: any) => {
            event.preventDefault();
            this.pagar();
          },
          onError: (error: any) => {
            console.error('❌ Error en cardForm', error);
          },
        },
      });
    } catch (error) {
      console.error('❌ Error al inicializar cardForm:', error);
    }
  }

  fillSavedData() {
    if (this.shippingData) {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      if (emailInput && this.shippingData.email) {
        emailInput.value = this.shippingData.email;
      }
    }

    const savedData = localStorage.getItem('paymentData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        
        Object.keys(data).forEach(key => {
          const input = document.getElementById(key) as HTMLInputElement;
          if (input && data[key]) {
            input.value = data[key];
          }
        });
      } catch (e) {
        console.warn('Error parsing paymentData', e);
      }
    }
  }

  async pagar() {
    if (
      !this.cardForm ||
      !this.cardFormMounted ||
      typeof this.cardForm.getCardFormData !== 'function'
    ) {
      alert('El formulario no está listo. Esperá unos segundos e intentá de nuevo.');
      console.error('❌ cardForm no está montado todavía');
      return;
    }

    try {
      const formData = this.cardForm.getCardFormData();

      if (!formData.token) {
        alert('Completa correctamente todos los campos del formulario.');
        console.error('❌ Token no generado. FormData:', formData);
        return;
      }

      const dataToSave = {
        email: formData.cardholderEmail,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber,
      };
      localStorage.setItem('paymentData', JSON.stringify(dataToSave));

      const payload = {
        transaction_amount: this.total,
        token: formData.token,
        description: 'Compra desde ecommerce',
        installments: formData.installments,
        payment_method_id: formData.paymentMethodId,
        issuer_id: formData.issuerId,
        payer: {
          email: formData.cardholderEmail,
          identification: {
            type: formData.identificationType,
            number: formData.identificationNumber,
          },
        },
      };

      const response = await fetch(
        'https://cddrmboopihkiuyomxle.supabase.co/functions/v1/quick-action',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.status === 'approved') {
        this.progress.completeStep('pago');
        this.router.navigate(['/checkout/success']);
      } else {
        alert('Error en el pago: ' + data.status_detail);
      }
    } catch (err) {
      console.error('❌ Error al procesar el pago:', err);
      alert('Ocurrió un error al procesar el pago. Reintentá más tarde.');
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
    console.log('Cambiar punto de retiro');
  }

  onChangeBillingData() {
    console.log('Cambiar datos de cobranza');
  }
}