import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  cartIsEmpty = true;
  constructor(
    public progress: CheckoutStepperProgressService,
    private cartService: CartService,
    public router: Router
  ) {
    this.progress.reset();
    this.cartService.cartItems$.subscribe(items => {
      this.cartIsEmpty = items.length === 0;
    });
  }
  canAccess(step: 'carrito' | 'envio' | 'pago'): boolean {
    if (step === 'envio' && this.cartIsEmpty) {
      return false;
    }
    return this.progress.canAccessStep(step);
  }
  goToEnvio() {
    if (this.canAccess('envio')) {
      this.router.navigate(['/checkout/envio']);
    }
  }
  resetPasos(): void {
    this.progress.reset();
  }
}
