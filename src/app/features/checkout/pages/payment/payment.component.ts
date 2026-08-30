import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../shared/utils/models/cartItems-model';
import {
  ShippingService,
  ShippingData,
  DiscountData} from '../../../../core/services/shipping.service';
import { Router } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { AcordiongenericComponent } from '../../../../shared/components/generic/acordiongeneric/acordiongeneric.component';
import { MercadoPagoService } from '../../../../core/services/mercado-pago.service';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../../core/services/notification.service';
import { ButtonPrimaryDirective } from '../../../../shared/utils/directives/button-primary.directive';
import { ModalComponent } from '../../../../shared/components/generic/modal/modal.component';
import { TextareaComponent } from '../../../../shared/components/generic/forms/textarea/textarea.component';
import { LucideAngularModule } from 'lucide-angular';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
    LucideAngularModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush})
export class PaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('skeletonContainer') skeletonContainer?: ElementRef<HTMLElement>;
  @ViewChild('skeletonContent') skeletonContent?: ElementRef<HTMLElement>;
  @ViewChild('mainContentContainer') mainContentContainer?: ElementRef<HTMLElement>;
  @ViewChild('mainLayoutContainer') mainLayoutContainer?: ElementRef<HTMLElement>;
  @ViewChild('checkoutSidebar') checkoutSidebar?: ElementRef<HTMLElement>;

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

  private isBrowser: boolean;
  private skeletonTimeline?: gsap.core.Timeline;
  private matchMediaInstance?: gsap.MatchMedia;

  constructor(
    private cartService: CartService,
    private shippingService: ShippingService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ordersService: OrdersService,
    private notificationService: NotificationService,
    private mercadoPagoService: MercadoPagoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }



  @HostListener('window:beforeunload')
  clearOnUnload() {}

  ngOnInit(): void {
    this.shippingData = this.shippingService.getShippingData();
    if (!this.shippingData) {
      this.router.navigate(['/checkout/envio']);
      return;
    }

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items.map((item) => ({
        ...item,
        variantMainImage: item.variantMainImage?.trim() || undefined}));
      this.cdr.detectChanges();
    });

    this.shippingService.discountData$.subscribe((data) => {
      this.discountData = data;
      this.cdr.detectChanges();
    });
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
            email: this.shippingData?.email || ''}},
        customization: {
          visual: {
            style: {
              theme: 'default'}}},
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
          }}};

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
        
        // Redirigir a pantalla de resultado fallido pasando el detalle exacto
        setTimeout(() => {
          this.router.navigate(['/checkout/resultado'], {
            queryParams: { 
              status: 'rejected', 
              orderId: orderResult.orderId,
              detail: errorData.status_detail || errorData.error || 'cc_rejected_other_reason'
            }
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
            queryParams: { 
              status: 'pending', 
              orderId: orderResult.orderId,
              detail: paymentResult.statusDetail || paymentResult.status || 'in_process'
            }
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

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // 1. Animar el test skeleton con un pulso suave (GSAP)
    const skeletonItems = document.querySelectorAll('.skeleton-item');
    if (skeletonItems.length > 0) {
      this.skeletonTimeline = gsap.timeline({ repeat: -1 });
      this.skeletonTimeline.to(skeletonItems, {
        opacity: 0.45,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
        stagger: 0.04
      });
    }

    // 2. Transición del skeleton: Esperar 1200ms, luego fade-out de skeleton y fade-in de main content
    setTimeout(() => {
      this.transitionSkeletonOut();
    }, 1200);
  }

  private transitionSkeletonOut(): void {
    if (!this.isBrowser) return;

    if (this.skeletonContent?.nativeElement) {
      // Detener animación de pulso
      this.skeletonTimeline?.kill();

      gsap.to(this.skeletonContent.nativeElement, {
        opacity: 0,
        y: -15,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => {
          this.showSkeleton = false;
          this.isLoading = false;
          this.cdr.detectChanges(); // Renderizar mainContentContainer

          if (this.mainContentContainer?.nativeElement) {
            gsap.fromTo(
              this.mainContentContainer.nativeElement,
              { opacity: 0, y: 15 },
              {
                opacity: 1,
                y: 0,
                duration: 0.55,
                ease: 'power2.out',
                onComplete: () => {
                  // Inicializar ScrollTrigger para el sticky de la sidebar una vez que el contenido sea visible
                  this.initStickySidebar();
                }
              }
            );
          }
        }
      });
    } else {
      // Fallback si no está el skeleton container
      this.showSkeleton = false;
      this.isLoading = false;
      this.cdr.detectChanges();
      this.initStickySidebar();
    }
  }

  private initStickySidebar(): void {
    if (!this.isBrowser || !this.checkoutSidebar?.nativeElement || !this.mainLayoutContainer?.nativeElement) return;

    // Clean up any existing matchMedia first
    if (this.matchMediaInstance) {
      this.matchMediaInstance.revert();
      this.matchMediaInstance = undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    this.matchMediaInstance = gsap.matchMedia();

    // Pin details only on desktop views (min-width: 1024px)
    this.matchMediaInstance.add("(min-width: 1024px)", () => {
      ScrollTrigger.create({
        trigger: this.checkoutSidebar!.nativeElement,
        start: "top 20px", // 20px space from top
        endTrigger: this.checkoutSidebar!.nativeElement.parentElement!,
        end: "bottom bottom",
        pin: true,
        pinSpacing: false,
        pinType: "transform",
        invalidateOnRefresh: true
      });
    });

    // Refresh layouts
    setTimeout(() => ScrollTrigger.refresh(), 100);
  }

  ngOnDestroy(): void {
    this.cleanupBrick();
    this.matchMediaInstance?.revert();
    this.skeletonTimeline?.kill();
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
      'violeta': '#7c3aed'};
    return map[color.toLowerCase().trim()] || color;
  }

  // Método para testing del skeleton loader
  simulateLoading(): void {
    if (!this.isBrowser) {
      this.showSkeleton = true;
      this.isLoading = true;
      setTimeout(() => {
        this.showSkeleton = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      }, 300);
      return;
    }

    this.showSkeleton = true;
    this.isLoading = true;

    if (this.matchMediaInstance) {
      this.matchMediaInstance.revert();
      this.matchMediaInstance = undefined;
    }

    this.cdr.detectChanges();

    // Re-start skeleton animation
    const skeletonItems = document.querySelectorAll('.skeleton-item');
    if (skeletonItems.length > 0) {
      this.skeletonTimeline?.kill();
      this.skeletonTimeline = gsap.timeline({ repeat: -1 });
      this.skeletonTimeline.to(skeletonItems, {
        opacity: 0.45,
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: 'power1.inOut',
        stagger: 0.04
      });
    }

    // Wait 1200ms and animate out
    setTimeout(() => {
      this.transitionSkeletonOut();
    }, 1200);
  }
}
