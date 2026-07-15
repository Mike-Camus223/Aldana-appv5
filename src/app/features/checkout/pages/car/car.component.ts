import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../../../shared/utils/models/cartItems-model';
import { CartService } from '../../../../core/services/cart.service';
import { Router } from '@angular/router';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import { FormsModule } from '@angular/forms';
import { NavbarPublicv3Component } from "../../../../shared/components/system/navbar-publicv3/navbar-publicv3.component";

@Component({
  selector: 'app-cartship',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarPublicv3Component],
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.css'],
})
export class CarComponent implements OnInit {
  cartItems: CartItem[] = [];
  isUpdating = false;
  isClearingCart = false;
  animateList = false;
  animateEmpty = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private progress: CheckoutStepperProgressService
  ) {}

  ngOnInit() {
    // Initialize with current cart state
    const currentItems = this.cartService.getCart();
    if (currentItems.length === 0) {
      // If cart is empty on init, immediately show empty state
      this.animateEmpty = true;
    }

    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items.map((item) => ({
        ...item,
        quantity: isNaN(Number(item.quantity)) ? 1 : Number(item.quantity),
        variantMainImage: item.variantMainImage?.trim()
          ? item.variantMainImage.trim()
          : undefined,
      }));

      // Trigger appropriate animation based on cart state
      if (this.cartItems.length === 0) {
        setTimeout(() => (this.animateEmpty = true), 30);
      } else {
        setTimeout(() => (this.animateList = true), 30);
      }
    });
  }

  /* --------------------------- */
  /* VACÍAR CARRITO              */
  /* --------------------------- */
  clearCart() {
    this.isClearingCart = true;
    this.startUpdating();
    this.animateList = false;
    setTimeout(() => {
      this.cartService.clearCart();
    }, 600);

    this.finishUpdating(true);
  }
  removeItem(id: string) {
    const isLastItem = this.cartItems.length === 1;
    this.startUpdating();

    if (isLastItem) {
      this.isClearingCart = true;
      this.animateList = false;

      setTimeout(() => {
        this.cartService.removeItem(id);
      }, 600);

      this.finishUpdating(true);
    } else {
      this.isClearingCart = false;
      this.cartService.removeItem(id);
      this.finishUpdating();
    }
  }

  /* --------------------------- */
  /* CAMBIAR CANTIDAD            */
  /* --------------------------- */
  onSelectQuantity(id: string, value: any) {
    this.isClearingCart = false;
    this.startUpdating();

    const qty = Number(value);
    if (!isNaN(qty) && qty >= 1) {
      this.cartService.setQuantity(id, qty);
    }

    this.finishUpdating();
  }

  /* --------------------------- */
  /* ANIMACIONES                 */
  /* --------------------------- */
  private startUpdating() {
    this.isUpdating = true;
    this.animateEmpty = false;
  }

  private finishUpdating(isClear = false) {
    setTimeout(() => {
      this.isUpdating = false;

      setTimeout(() => {
        if (
          (isClear || this.cartItems.length === 0) &&
          this.cartItems.length === 0
        ) {
          this.animateEmpty = true;
        } else {
          this.animateList = true;
        }
      }, 40);
    }, 600);
  }
  /* --------------------------- */
  /* UTILIDADES                  */
  /* --------------------------- */
  getTotalItems(): number {
    return this.cartItems.reduce((a, i) => a + i.quantity, 0);
  }

  getSubtotal(): number {
    return this.cartItems.reduce((a, i) => a + i.price * i.quantity, 0);
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
      'violeta': '#7c3aed',
    };
    return map[color.toLowerCase().trim()] || color;
  }

  goToReturn() {
    this.router.navigate(['/']);
  }

  goToShipping() {
    if (this.cartItems.length > 0) {
      this.progress.completeStep('carrito');
      this.router.navigate(['/checkout/envio']);
    }
  }
}
