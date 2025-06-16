import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { ButtonPrimaryDirective } from '../../../../shared/utils/directives/button-primary.directive';
import { AldyCheckboxV1Directive } from '../../../../shared/utils/directives/aldy-checkbox-v1.directive';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../shared/utils/models/cartItems-model';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';


@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    FormsModule,
    AccordionModule,
    ChipModule,
    AldyCheckboxV1Directive,
    ButtonPrimaryDirective
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  saveData = true;
  phoneNumber = '011 6436-8404';

  cartItems: CartItem[] = [];

  delivery = {
    service: 'Correo Argentino Expreso',
    deliveryType: 'Envío a domicilio',
    cost: 'Gratis',
    deliveryDates: 'Llega entre viernes 13/06 y lunes 16/06'
  };

  address = {
    name: 'Mike Camps',
    address: 'maedres 1123, 7C',
    cp: '1192',
    neighborhood: 'Almagro',
    city: 'Capital Federal',
    phone: '+541164368404'
  };

  constructor(private cartService: CartService,
    private progress: CheckoutStepperProgressService,) { }

  ngOnInit(): void {

    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
    });
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  realizarPedido() {
    console.log('Pedido realizado');
    this.progress.completeStep('pago');
  }


  alterarNumero() {
    console.log('Alterar número');
  }

  agregarNota() {
    console.log('Agregar nota');
  }
}
