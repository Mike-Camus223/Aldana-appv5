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

  readonly ciudades = [
    { id: 1, name: 'Buenos Aires' },
    { id: 2, name: 'Córdoba' },
    { id: 3, name: 'Rosario' }
  ];

  readonly provinces = provinces_arg;

  hasCupon = false;
  anotherPerson = false;
  discountCode = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private notification: NotificationService ,
    private progress: CheckoutStepperProgressService,

  ) {}

  ngOnInit(): void {
    this.initForm();

    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
      });

    this.form.get('invoiceToCompany')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(isCompany => {
        this.toggleInvoiceValidators(isCompany);
      });

    this.form.get('zipCode')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.form.get('zipCodeDisplay')?.setValue(value || '');
      });
  }

  private initForm(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      receiveOffers: [false],
      zipCode: ['', [Validators.required, cpaArg]],
      name: ['', Validators.required],
      surname: ['', Validators.required],
      phone: ['', [Validators.required, argPhoneValidator]],
      street: ['', Validators.required],
      streetNumber: ['', Validators.required],
      apartment: [''],
      neighborhood: [''],
      city: [null, Validators.required],
      invoiceToCompany: [false],
      hasCupon: [false],
      discountCode: [''],
      otherPerson: [false],
      province: [null, Validators.required],
      hasDniCuit: ['', dniCuitValidator],
      cuit: [''],
      socialReason: [''],
      zipCodeDisplay: [{ value: '', disabled: true }],
    });
  }

  private toggleInvoiceValidators(isCompany: boolean): void {
    const hasDniCuit = this.form.get('hasDniCuit');
    const cuit = this.form.get('cuit');
    const socialReason = this.form.get('socialReason');

    if (isCompany) {
      hasDniCuit?.clearValidators();
      hasDniCuit?.reset();

      cuit?.setValidators([Validators.required, dniCuitValidator]);
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

  continue(): void {
    const zipCodeControl = this.form.get('zipCode');
    if (zipCodeControl?.valid) {
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
    console.log('Datos de envío:', this.form.value);
    this.progress.completeStep('envio');
    this.notification.showSuccess('Formulario enviado', 'Los datos de envío se procesaron correctamente.');
  } else {
    this.notification.showWarn('Campos incompletos', 'Por favor completá todos los campos requeridos.');
  }
}


  applyDiscountCode(): void {
    const code = this.discountCode.trim();
    if (code) {
      this.notification.showSuccess('Descuento aplicado', `Código de descuento: ${code}`);
    } else {
      this.notification.showWarn('Código inválido', 'Ingresá un código válido.');
    }
  }

  get subtotal(): number {
    return this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get shippingCost(): number {
    return this.selected === 'expres' ? 15 : 0;
  }

  get total(): number {
    return this.subtotal + this.shippingCost;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
