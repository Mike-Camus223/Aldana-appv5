import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CartItem } from '../../../../shared/utils/models/cartItems-model';
import { CartService } from '../../../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cartship',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car.component.html',
  styleUrls: ['./car.component.css']
})
export class CarComponent implements OnInit {
  cartItems: CartItem[] = [];

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items.map(item => ({
        ...item,
        quantity: isNaN(Number(item.quantity)) ? 1 : Number(item.quantity)
      }));
    });
  }

  clearCart() {
    this.cartService.clearCart();
  }

  removeItem(id: string) {
    this.cartService.removeItem(id);
  }

  changeQuantity(id: string, change: number) {
    const item = this.cartItems.find(item => item.id === id);
    if (!item) return;

    if (item.quantity + change <= 0) {
      this.removeItem(id);
    } else {
      this.cartService.updateQuantity(id, change);
    }
  }

  updateQuantityManually(id: string, value: string) {
    const numericValue = Number(value);
    const quantity = isNaN(numericValue) || numericValue < 1 ? 1 : Math.floor(numericValue);
    this.cartService.setQuantity(id, quantity);
  }

  getSubtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }

  goToShipping() {
  this.router.navigate(['/home']);
}

}
