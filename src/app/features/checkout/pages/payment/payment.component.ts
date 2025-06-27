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
  changeDetection: ChangeDetectionStrategy.OnPush // ✅ Evita errores de change detection
})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  shippingData: ShippingData | null = null;
  cartItems: CartItem[] = [];
  discountData: DiscountData | null = null;
  cardForm: any = null;
  cardFormMounted = false;
  formId = 'paymentForm-' + Math.random().toString(36).substring(2, 10);
  isProcessing = false; // ✅ Prevenir múltiples envíos

  constructor(
    private cartService: CartService,
    private progress: CheckoutStepperProgressService,
    private shippingService: ShippingService,
    private router: Router,
    private mpService: MercadoPagoService,
    private cdr: ChangeDetectorRef // ✅ Para manejar change detection manual
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
      this.cdr.detectChanges(); // ✅ Actualizar vista manualmente
    });

    this.shippingService.discountData$.subscribe((data) => {
      this.discountData = data;
      this.cdr.detectChanges(); // ✅ Actualizar vista manualmente
    });
  }

  ngAfterViewInit(): void {
    // ✅ Dar más tiempo para que el DOM esté listo
    setTimeout(() => this.initializeCardForm(), 300);
  }

  ngOnDestroy(): void {
    this.destroyCardForm();
  }

  destroyCardForm() {
    if (this.cardForm?.destroy) {
      try {
        this.cardForm.destroy();
        console.log('✅ CardForm destruido correctamente');
      } catch (error) {
        console.warn('⚠️ Error al destruir cardForm:', error);
      }
    }
    this.cardForm = null;
    this.cardFormMounted = false;
  }

  async initializeCardForm() {
    if (this.cardFormMounted) {
      console.warn('⚠️ CardForm ya está montado.');
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
            
            // ✅ Usar setTimeout para evitar problemas de timing
            setTimeout(() => {
              this.fillSavedData();
            }, 100);
          },
          onSubmit: (event: any) => {
            event.preventDefault();
            this.pagar();
          },
          onError: (error: any) => {
            console.error('❌ Error en cardForm:', error);
          },
        },
      });
    } catch (error) {
      console.error('❌ Error al inicializar cardForm:', error);
    }
  }

  fillSavedData() {
    try {
      // ✅ Llenar email del shipping
      if (this.shippingData?.email) {
        const emailInput = document.getElementById('email') as HTMLInputElement;
        if (emailInput) {
          emailInput.value = this.shippingData.email;
          // ✅ Disparar evento para que MercadoPago detecte el cambio
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      // ✅ Llenar datos guardados del localStorage
      const savedData = localStorage.getItem('paymentData');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        Object.keys(data).forEach(key => {
          const input = document.getElementById(key) as HTMLInputElement | HTMLSelectElement;
          if (input && data[key]) {
            input.value = data[key];
            // ✅ Disparar evento para que MercadoPago detecte el cambio
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Error llenando datos guardados:', error);
    }
  }

  async pagar() {
    // ✅ Prevenir múltiples envíos
    if (this.isProcessing) {
      console.warn('⚠️ Pago ya en proceso...');
      return;
    }

    if (!this.cardForm || !this.cardFormMounted || typeof this.cardForm.getCardFormData !== 'function') {
      alert('El formulario no está listo. Esperá unos segundos e intentá de nuevo.');
      console.error('❌ cardForm no está montado todavía');
      return;
    }

    this.isProcessing = true;

    try {
      const formData = this.cardForm.getCardFormData();
      
      console.log('📋 FormData de MercadoPago:', formData);

      if (!formData.token) {
        alert('Error generando el token de la tarjeta. Verificá los datos ingresados.');
        console.error('❌ Token no generado. FormData:', formData);
        return;
      }

      if (!formData.cardholderEmail) {
        alert('El correo electrónico es obligatorio.');
        return;
      }

      if (!formData.identificationType || !formData.identificationNumber) {
        alert('Los datos de identificación son obligatorios.');
        return;
      }
      

      const dataToSave = {
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

      console.log('📤 Payload enviado a Supabase:', JSON.stringify(payload, null, 2));

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

      console.log('📥 Status de respuesta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = `Error del servidor (${response.status})`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        alert(`Error en el pago: ${errorMessage}`);
        return;
      }

      const data = await response.json();
      console.log('📥 Respuesta completa de MercadoPago:', data);

      if (data.status === 'approved') {
        alert('¡Pago aprobado exitosamente!');
        this.progress.completeStep('pago');
        this.router.navigate(['/checkout/success']);
      } else if (data.status === 'pending') {
        alert('Pago pendiente de aprobación. Te notificaremos cuando se procese.');
      } else if (data.status === 'rejected') {
        const statusDetail = data.status_detail || 'Error desconocido';
        alert(`Pago rechazado: ${this.getStatusDetailMessage(statusDetail)}`);
      } else {
        const statusDetail = data.status_detail || data.message || 'Error desconocido';
        alert(`Error en el pago: ${statusDetail}`);
      }

    } catch (err) {
      console.error('❌ Error al procesar el pago:', err);
      alert('Ocurrió un error al procesar el pago. Por favor, intentá de nuevo.');
    } finally {
      this.isProcessing = false;
    }
  }

  private getStatusDetailMessage(statusDetail: string): string {
    const messages: { [key: string]: string } = {
      'cc_rejected_insufficient_amount': 'Fondos insuficientes',
      'cc_rejected_bad_filled_security_code': 'Código de seguridad inválido',
      'cc_rejected_bad_filled_date': 'Fecha de vencimiento inválida',
      'cc_rejected_bad_filled_card_number': 'Número de tarjeta inválido',
      'cc_rejected_blacklist': 'Tarjeta bloqueada',
      'cc_rejected_call_for_authorize': 'Debes autorizar el pago con tu banco',
      'cc_rejected_card_disabled': 'Tarjeta deshabilitada',
      'cc_rejected_duplicated_payment': 'Pago duplicado',
      'cc_rejected_high_risk': 'Pago rechazado por alto riesgo',
      'cc_rejected_invalid_installments': 'Cuotas inválidas',
      'cc_rejected_max_attempts': 'Máximo de intentos alcanzado',
    };
    
    return messages[statusDetail] || statusDetail;
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
    this.router.navigate(['/checkout/shipping']);
  }

  onChangeBillingData() {
    console.log('Cambiar datos de cobranza');
    this.router.navigate(['/checkout/shipping']);
  }
}