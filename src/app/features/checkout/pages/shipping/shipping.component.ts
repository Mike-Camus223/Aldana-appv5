import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { InputComponent } from '../../../../shared/components/input/input.component';
import { SelectsComponent } from '../../../../shared/components/selects/selects.component';
import { AldyCheckboxV1Directive } from '../../../../shared/utils/directives/aldy-checkbox-v1.directive';
import { ButtonPrimaryDirective } from '../../../../shared/utils/directives/button-primary.directive';

import { CartService } from '../../../../core/services/cart.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CartItem } from '../../../../shared/utils/models/cartItems-model';
import { cpaArg } from '../../../../shared/utils/validators/cpaArg.validator';
import { provinces_arg } from '../../../../shared/utils/data/provinces';
import { dniCuitValidator } from '../../../../shared/utils/validators/dniCuit.validator';
import { argPhoneValidator } from '../../../../shared/utils/validators/argPhone.validator';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import { ShippingData, ShippingService } from '../../../../core/services/shipping.service';
import { Router } from '@angular/router';
import { onlyCuitValidator } from '../../../../shared/utils/validators/onlyCuit.validator';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { DiscountData } from '../../../../core/services/shipping.service';

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
    FloatLabelModule,
    SelectsComponent,
    AldyCheckboxV1Directive,
    ButtonPrimaryDirective,
  ],
  animations: [
    trigger('toggleOptions', [
      state('void', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out')
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class ShippingComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  cartItems: CartItem[] = [];
  showForm = false;
  showAllOptions = false;
  selected: 'estandar' | 'expres' | 'retiro' = 'estandar';

  appliedDiscount = 0; 
  discountType: 'percent' | 'fixed' | null = null;
  discountCodeApplied: string | null = null;
  discountError: string | null = null;

  readonly provinces = provinces_arg;
  readonly ciudades = [
    { id: 1, name: 'Buenos Aires' },
    { id: 2, name: 'Córdoba' },
    { id: 3, name: 'Rosario' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private notification: NotificationService,
    private progress: CheckoutStepperProgressService,
    private shippingService: ShippingService,
    private router: Router,
    private supabaseService: SupabaseService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    const discountData = this.shippingService.getDiscountData();
    if (discountData) {
      this.form.patchValue({
        discountCode: discountData.code,
        hasCupon: true
      });
      this.discountCodeApplied = discountData.code;
      this.discountType = discountData.discountType;
      this.recalculateDiscount(discountData);
    }

    this.toggleInvoiceValidators(this.form.get('invoiceToCompany')?.value);

    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
        if (this.discountCodeApplied) {
          const discountData = this.shippingService.getDiscountData();
          if (discountData) {
            this.recalculateDiscount(discountData);
          }
        }
      });

    this.form.get('invoiceToCompany')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isCompany => this.toggleInvoiceValidators(isCompany));

    this.form.get('zipCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.form.get('zipCodeDisplay')?.setValue(value || ''));

    this.form.get('otherPerson')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => this.toggleOtherPersonValidators(val));

    this.toggleOtherPersonValidators(this.form.get('otherPerson')?.value);
  }

  private initForm(): void {
    const savedData = localStorage.getItem('shippingFormData');
    const formDefaults = savedData ? JSON.parse(savedData) : {};

    this.form = this.fb.group({
      email: [formDefaults.email || '', [Validators.required, Validators.email]],
      receiveOffers: [formDefaults.receiveOffers || false],
      zipCode: [formDefaults.zipCode || '', [Validators.required, cpaArg]],
      name: [formDefaults.name || '', Validators.required],
      surname: [formDefaults.surname || '', Validators.required],
      phone: [formDefaults.phone || '', [Validators.required, argPhoneValidator]],
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
    });
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
      cuit?.clearValidators(); cuit?.reset();
      socialReason?.clearValidators(); socialReason?.reset();
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
      otherName?.clearValidators(); otherName?.reset();
      otherSurname?.clearValidators(); otherSurname?.reset();
    }

    otherName?.updateValueAndValidity();
    otherSurname?.updateValueAndValidity();
  }

  continue(): void {
    if (this.form.get('zipCode')?.valid) {
      this.showForm = true;
    }
  }

  changeZipCode(): void {
    this.showForm = false;
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

      const nameToUse = formValue.otherPerson ? formValue.otherPersonName : formValue.name;
      const surnameToUse = formValue.otherPerson ? formValue.otherPersonSurname : formValue.surname;

      const shippingData: ShippingData = {
        name: nameToUse,
        surname: surnameToUse,
        address: `${formValue.street} ${formValue.streetNumber}`,
        apartment: formValue.apartment,
        zipCode: formValue.zipCode,
        neighborhood: formValue.neighborhood,
        city: formValue.city,
        province: formValue.province.name,
        phone: formValue.phone,
        invoiceToCompany: formValue.invoiceToCompany,
        dniOrCuit: formValue.cuit || formValue.hasDniCuit,
        razonSocial: formValue.socialReason,
        email: formValue.email
      };

      const dataToSave = { ...formValue };
      delete dataToSave.discountCode;
      delete dataToSave.appliedDiscount;
      delete dataToSave.hasCupon;

      localStorage.setItem('shippingFormData', JSON.stringify(dataToSave));

      this.shippingService.setShippingData(shippingData);
      this.router.navigate(['/checkout/pago']);
      this.progress.completeStep('envio');
      this.notification.showSuccess('Formulario enviado', 'Los datos de envío se procesaron correctamente.');
    } else {
      this.notification.showWarn('Campos incompletos', 'Por favor completá todos los campos requeridos.');
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

    this.supabaseService.validateCoupon(code).then(result => {
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
          appliedDiscount = subtotal * (result.discountAmount || 0) / 100;
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
          discountType: result.discountType || 'fixed'
        };

        this.shippingService.setDiscountData(discountData);

        this.form.patchValue({ hasCupon: true });

        this.notification.showSuccess('Cupón aplicado', 
          `Descuento de ${this.discountType === 'percent' ? result.discountAmount + '%' : '$' + this.appliedDiscount.toFixed(2)}`
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
      appliedDiscount = subtotal * (discountData.discountAmount || 0) / 100;
    } else {
      appliedDiscount = discountData.discountAmount || 0;
    }

    if (appliedDiscount > subtotal) appliedDiscount = subtotal;

    this.appliedDiscount = appliedDiscount;
  }

  get subtotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get shippingCost(): number {
    return this.selected === 'expres' ? 15 : 0;
  }

  get total(): number {
    return Math.max(0, this.subtotal + this.shippingCost - this.appliedDiscount);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
