import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  trigger,
  state,
  style,
  animate,
  transition} from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { AldyCheckboxV1Directive } from '../../../../shared/directives/ui/aldy-checkbox.directive';
import { CartService } from '../../../../core/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CartItem } from '../../../../shared/models/cartItems-model';
import { cpaArg } from '../../../../shared/validators/cpaArg.validator';
import { provinces_arg } from '../../../../shared/constants/provinces.constant';
import { dniCuitValidator } from '../../../../shared/validators/dniCuit.validator';
import { argPhoneValidator } from '../../../../shared/validators/argPhone.validator';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import {
  ShippingData,
  ShippingService} from '../../../../core/services/shipping.service';
import { Router, RouterModule } from '@angular/router';
import { onlyCuitValidator } from '../../../../shared/validators/onlyCuit.validator';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { MiCorreoService, ShippingRate, Agency } from '../../../../core/services/micorreo.service';
import { DiscountData } from '../../../../core/services/shipping.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { CuponserviceService } from '../../../../core/services/data-access/cupon/cuponservice.service';

@Component({
  selector: 'app-shipping',
  standalone: true,
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.css'],
  imports: [
    InputComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SelectsComponent,
    AldyCheckboxV1Directive,
    LucideAngularModule,
    RouterModule
  ],
  animations: [
    trigger('toggleOptions', [
      state('void', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out')]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: '0', opacity: 0 }))])])],
  changeDetection: ChangeDetectionStrategy.Eager})
export class ShippingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('skeletonContainer') skeletonContainer?: ElementRef<HTMLElement>;
  @ViewChild('skeletonContent') skeletonContent?: ElementRef<HTMLElement>;
  @ViewChild('mainContentContainer') mainContentContainer?: ElementRef<HTMLElement>;
  @ViewChild('mainLayoutContainer') mainLayoutContainer?: ElementRef<HTMLElement>;
  @ViewChild('checkoutSidebar') checkoutSidebar?: ElementRef<HTMLElement>;

  form!: FormGroup;
  cartItems: CartItem[] = [];
  showForm = false;
  showAllOptions = false;
  selected: 'estandar' | 'expres' | 'retiro' = 'estandar';
  appliedDiscount = 0;
  discountType: 'percent' | 'fixed' | null = null;
  discountCodeApplied: string | null = null;
  discountError: string | null = null;
  isLoading = true;
  showSkeleton = true;

  readonly provinces = provinces_arg;
  readonly ciudades = [
    { id: 1, name: 'Buenos Aires' },
    { id: 2, name: 'Córdoba' },
    { id: 3, name: 'Rosario' }];

  isCalculatingShipping = false;
  homeShippingPrice = 3500;
  homeDeliveryTime = 'Llega en 3 a 5 días hábiles';
  agencyShippingPrice = 2200;
  agencyDeliveryTime = 'Llega en 4 a 6 días hábiles';
  agencies: Agency[] = [];
  selectedAgency: Agency | null = null;

  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private skeletonTimeline?: gsap.core.Timeline;
  private matchMediaInstance?: gsap.MatchMedia;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private notification: NotificationService,
    private progress: CheckoutStepperProgressService,
    private shippingService: ShippingService,
    private router: Router,
    private cuponService: CuponserviceService,
    private authService: AuthService,
    private miCorreoService: MiCorreoService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initForm();

    // Configurar el email del usuario autenticado
    this.setupUserEmail();

    const discountData = this.shippingService.getDiscountData();
    if (discountData) {
      this.form.patchValue({
        discountCode: discountData.code,
        hasCupon: true});
      this.discountCodeApplied = discountData.code;
      this.discountType = discountData.discountType;
      this.recalculateDiscount(discountData);
    }

    this.toggleInvoiceValidators(false);

    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        this.cartItems = items;
        if (this.discountCodeApplied) {
          const discountData = this.shippingService.getDiscountData();
          if (discountData) {
            this.recalculateDiscount(discountData);
          }
        }
      });

    this.form
      .get('zipCode')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) =>
        this.form.get('zipCodeDisplay')?.setValue(value || '')
      );

    this.form
      .get('otherPerson')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.toggleOtherPersonValidators(val));

    this.toggleOtherPersonValidators(this.form.get('otherPerson')?.value);

    // Escuchar cambios de provincia para cargar agencias
    this.form.get('province')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((prov) => {
      if (prov) {
        const provName = typeof prov === 'object' ? prov.name : prov;
        const letterCode = this.getProvinceLetterCode(provName);
        this.loadAgencies(letterCode);
      }
    });

    // Escuchar cambios de agencia seleccionada
    this.form.get('agencyCode')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((code) => {
      this.selectedAgency = this.agencies.find(a => a.code === code) || null;
    });
  }

  private initForm(): void {
    const savedData = localStorage.getItem('shippingFormData');
    const formDefaults = savedData ? JSON.parse(savedData) : {};

    this.form = this.fb.group({
      email: [
        { value: '', disabled: false }, // Habilitado para permitir ingresar correos de prueba de Mercado Pago
        [Validators.required, Validators.email]],
      receiveOffers: [formDefaults.receiveOffers || false],
      zipCode: [formDefaults.zipCode || '', [Validators.required, cpaArg]],
      name: [formDefaults.name || '', Validators.required],
      surname: [formDefaults.surname || '', Validators.required],
      phone: [
        formDefaults.phone || '',
        [Validators.required, argPhoneValidator]],
      street: [formDefaults.street || '', Validators.required],
      streetNumber: [formDefaults.streetNumber || '', Validators.required],
      apartment: [formDefaults.apartment || ''],
      neighborhood: [formDefaults.neighborhood || ''],
      city: [formDefaults.city || null, Validators.required],
      invoiceToCompany: [formDefaults.invoiceToCompany || false],
      hasCupon: [false],
      discountCode: [''],
      otherPerson: [formDefaults.otherPerson || false],
      province: [formDefaults.province || null, Validators.required],
      hasDniCuit: [formDefaults.hasDniCuit || '', dniCuitValidator],
      cuit: [formDefaults.cuit || ''],
      socialReason: [formDefaults.socialReason || ''],
      zipCodeDisplay: [{ value: formDefaults.zipCode || '', disabled: true }],
      otherPersonName: [formDefaults.otherPersonName || ''],
      otherPersonSurname: [formDefaults.otherPersonSurname || ''],
      agencyCode: [formDefaults.agencyCode || '']});
  }

  private setupUserEmail(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.email) {
      // Pre-llenar el email del usuario autenticado y mantenerlo deshabilitado
      this.form.patchValue({ email: currentUser.email });
    } else {
      // Si no hay usuario autenticado, redirigir al login
      this.notification.showError(
        'Sesión requerida',
        'Debes iniciar sesión para continuar con la compra.'
      );
      this.router.navigate(['/cuenta/iniciar-sesion']);
    }
  }

  private toggleInvoiceValidators(isCompany: boolean): void {
    const hasDniCuit = this.form.get('hasDniCuit');
    const cuit = this.form.get('cuit');
    const socialReason = this.form.get('socialReason');

    if (isCompany) {
      hasDniCuit?.clearValidators();
      hasDniCuit?.reset();
      cuit?.setValidators([Validators.required, onlyCuitValidator]);
      socialReason?.setValidators([Validators.required]);
    } else {
      hasDniCuit?.setValidators([Validators.required, dniCuitValidator]);
      cuit?.clearValidators();
      cuit?.reset();
      socialReason?.clearValidators();
      socialReason?.reset();
    }

    hasDniCuit?.updateValueAndValidity();
    cuit?.updateValueAndValidity();
    socialReason?.updateValueAndValidity();
  }

  private toggleOtherPersonValidators(isOtherPerson: boolean | null): void {
    const otherName = this.form.get('otherPersonName');
    const otherSurname = this.form.get('otherPersonSurname');

    if (isOtherPerson) {
      otherName?.setValidators([Validators.required]);
      otherSurname?.setValidators([Validators.required]);
    } else {
      otherName?.clearValidators();
      otherName?.reset();
      otherSurname?.clearValidators();
      otherSurname?.reset();
    }

    otherName?.updateValueAndValidity();
    otherSurname?.updateValueAndValidity();
  }

  continue(): void {
    if (this.form.get('zipCode')?.valid) {
      const zipCode = this.form.get('zipCode')?.value;
      this.isCalculatingShipping = true;
      this.notification.showInfo('Cotizando', 'Calculando el costo de envío para tu código postal...');

      const itemsPayload = this.cartItems.map(item => ({ id: item.id.substring(0, 36), quantity: item.quantity }));

      this.miCorreoService.getRates(zipCode, itemsPayload).then((rates) => {
        const homeRate = rates.find(r => r.deliveryType === 'D');
        const agencyRate = rates.find(r => r.deliveryType === 'S');

        if (homeRate) {
          this.homeShippingPrice = homeRate.price;
          this.homeDeliveryTime = `Llega en ${homeRate.deliveryTimeMin}-${homeRate.deliveryTimeMax} días hábiles`;
        }
        if (agencyRate) {
          this.agencyShippingPrice = agencyRate.price;
          this.agencyDeliveryTime = `Llega en ${agencyRate.deliveryTimeMin}-${agencyRate.deliveryTimeMax} días hábiles`;
        }

        // Cargar agencias por defecto si la provincia ya está seleccionada o cargamos CABA por defecto
        const selectedProv = this.form.get('province')?.value;
        const provName = selectedProv ? (typeof selectedProv === 'object' ? selectedProv.name : selectedProv) : 'Ciudad Autónoma de Buenos Aires';
        this.loadAgencies(this.getProvinceLetterCode(provName));

        this.showForm = true;
        if (this.isBrowser) {
          setTimeout(() => ScrollTrigger.refresh(), 150);
        }
      }).catch(err => {
        console.error('Error fetching rates:', err);
        this.notification.showWarn('Servicio limitado', 'Se utilizarán tarifas de envío estándar de contingencia.');
        // Tarifas fallback
        this.homeShippingPrice = 3500;
        this.agencyShippingPrice = 2200;
        this.showForm = true;
        if (this.isBrowser) {
          setTimeout(() => ScrollTrigger.refresh(), 150);
        }
      }).finally(() => {
        this.isCalculatingShipping = false;
      });
    }
  }

  getProvinceLetterCode(provinceName: string): string {
    const mapping: Record<string, string> = {
      'Ciudad Autónoma de Buenos Aires': 'C',
      'CABA': 'C',
      'Buenos Aires': 'B',
      'Córdoba': 'X',
      'Santa Fe': 'S',
      'Mendoza': 'M',
      'Tucumán': 'T',
      'Salta': 'A',
      'Entre Ríos': 'E',
      'Misiones': 'N',
      'Chaco': 'H',
      'Corrientes': 'W',
      'Santiago del Estero': 'G',
      'San Juan': 'J',
      'Jujuy': 'Y',
      'Río Negro': 'R',
      'Neuquén': 'Q',
      'Formosa': 'P',
      'Chubut': 'U',
      'San Luis': 'D',
      'Catamarca': 'K',
      'La Rioja': 'F',
      'La Pampa': 'L',
      'Santa Cruz': 'Z',
      'Tierra del Fuego': 'V'
    };
    return mapping[provinceName] || 'C';
  }

  loadAgencies(letterCode: string): void {
    this.miCorreoService.getAgencies(letterCode).then((agencies) => {
      this.agencies = agencies;
      if (agencies.length > 0) {
        // Seleccionar la primera por defecto si no hay seleccionada
        const currentCode = this.form.get('agencyCode')?.value;
        if (!agencies.some(a => a.code === currentCode)) {
          this.form.get('agencyCode')?.setValue(agencies[0].code);
          this.selectedAgency = agencies[0];
        } else {
          this.selectedAgency = agencies.find(a => a.code === currentCode) || null;
        }
      } else {
        this.form.get('agencyCode')?.setValue('');
        this.selectedAgency = null;
      }
    }).catch(err => {
      console.error('Error loading agencies:', err);
      this.agencies = [];
    });
  }

  changeZipCode(): void {
    this.showForm = false;
    if (this.isBrowser) {
      setTimeout(() => ScrollTrigger.refresh(), 150);
    }
  }

  select(option: 'estandar' | 'expres' | 'retiro'): void {
    this.selected = option;
  }

  toggleAllOptions(): void {
    this.showAllOptions = !this.showAllOptions;
  }

  get isAnotherPerson(): boolean {
    return this.form.get('otherPerson')?.value;
  }

  submitForm(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const currentUser = this.authService.getCurrentUser();

      // Validación de seguridad: verificar usuario autenticado
      if (!currentUser?.email) {
        this.notification.showError(
          'Error de autenticación',
          'No se pudo verificar tu identidad. Por favor, inicia sesión nuevamente.'
        );
        this.router.navigate(['/cuenta/iniciar-sesion']);
        return;
      }

      // Obtener el email del formulario usando getRawValue
      const formEmail = this.form.getRawValue().email;

      const nameToUse = formValue.otherPerson
        ? formValue.otherPersonName
        : formValue.name;
      const surnameToUse = formValue.otherPerson
        ? formValue.otherPersonSurname
        : formValue.surname;

      const shippingData: ShippingData = {
        name: nameToUse,
        surname: surnameToUse,
        address: `${formValue.street} ${formValue.streetNumber}`,
        apartment: formValue.apartment,
        zipCode: formValue.zipCode,
        neighborhood: formValue.neighborhood,
        city: typeof formValue.city === 'object' ? formValue.city.name : formValue.city,
        province: formValue.province?.name || formValue.province,
        phone: formValue.phone,
        invoiceToCompany: formValue.invoiceToCompany,
        dniOrCuit: formValue.cuit || formValue.hasDniCuit,
        razonSocial: formValue.socialReason,
        email: formEmail, // Usar el email del usuario autenticado
        shippingCost: this.shippingCost,
        deliveryType: this.selected === 'estandar' ? 'D' : 'S',
        agencyCode: this.selected === 'retiro' ? formValue.agencyCode : undefined,
        agencyName: this.selected === 'retiro' && this.selectedAgency ? this.selectedAgency.name : undefined};

      const dataToSave = { ...formValue };
      delete dataToSave.discountCode;
      delete dataToSave.appliedDiscount;
      delete dataToSave.hasCupon;

      localStorage.setItem('shippingFormData', JSON.stringify(dataToSave));

      this.shippingService.setShippingData(shippingData);
      this.router.navigate(['/checkout/pago']);
      this.progress.completeStep('envio');
      this.notification.showSuccess(
        'Formulario enviado',
        'Los datos de envío se procesaron correctamente.'
      );
    } else {
      this.notification.showWarn(
        'Campos incompletos',
        'Por favor completá todos los campos requeridos.'
      );
      this.form.markAllAsTouched();
    }
  }

  applyDiscountCode(): void {
    const code = this.form.get('discountCode')?.value?.trim();

    if (!code) {
      this.discountError = 'Ingrese un código de descuento.';
      this.notification.showWarn('Cupón inválido', this.discountError);
      return;
    }

    this.cuponService.validateCoupon(code).then((result) => {
      if (!result.valid) {
        this.discountError = result.error || 'Cupón inválido.';
        this.appliedDiscount = 0;
        this.discountType = null;
        this.discountCodeApplied = null;
        this.shippingService.setDiscountData(null);
        this.notification.showError('Cupón inválido', this.discountError);
      } else {
        this.discountError = null;
        this.discountType = result.discountType || 'fixed';
        this.discountCodeApplied = code;

        const subtotal = this.subtotal;
        let appliedDiscount = 0;

        if (this.discountType === 'percent') {
          appliedDiscount = (subtotal * (result.discountAmount || 0)) / 100;
        } else {
          appliedDiscount = result.discountAmount || 0;
        }

        if (appliedDiscount > subtotal) {
          appliedDiscount = subtotal;
        }

        this.appliedDiscount = appliedDiscount;

        const discountData: DiscountData = {
          code,
          discountAmount: result.discountAmount || 0,
          discountType: result.discountType || 'fixed'};

        this.shippingService.setDiscountData(discountData);

        this.form.patchValue({ hasCupon: true });

        this.notification.showSuccess(
          'Cupón aplicado',
          `Descuento de ${this.discountType === 'percent'
            ? result.discountAmount + '%'
            : '$' + this.appliedDiscount.toFixed(2)
          }`
        );
      }
    });
  }

  resetForm(): void {
    this.form.reset();
    localStorage.removeItem('shippingFormData');
    this.showForm = false;
    this.appliedDiscount = 0;
    this.discountCodeApplied = null;
    this.discountError = null;
  }

  private recalculateDiscount(discountData: DiscountData) {
    const subtotal = this.subtotal;
    let appliedDiscount = 0;

    if (discountData.discountType === 'percent') {
      appliedDiscount = (subtotal * (discountData.discountAmount || 0)) / 100;
    } else {
      appliedDiscount = discountData.discountAmount || 0;
    }

    if (appliedDiscount > subtotal) appliedDiscount = subtotal;

    this.appliedDiscount = appliedDiscount;
  }

  get subtotal(): number {
    return this.cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  get shippingCost(): number {
    if (this.selected === 'estandar') {
      return this.homeShippingPrice;
    } else if (this.selected === 'retiro') {
      return this.agencyShippingPrice;
    }
    return 0;
  }

  get total(): number {
    return Math.max(
      0,
      this.subtotal + this.shippingCost - this.appliedDiscount
    );
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
        start: "top 20px", // 20px padding from viewport top
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
    this.destroy$.next();
    this.destroy$.complete();
    this.matchMediaInstance?.revert();
    this.skeletonTimeline?.kill();
  }

  // Método para testing del skeleton loader
  simulateLoading(): void {
    if (!this.isBrowser) {
      this.showSkeleton = true;
      this.isLoading = true;
      setTimeout(() => {
        this.showSkeleton = false;
        this.isLoading = false;
      }, 800);
      return;
    }

    // Reset status to visible/invisible
    this.showSkeleton = true;
    this.isLoading = true;

    // Revert matchMedia context
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
