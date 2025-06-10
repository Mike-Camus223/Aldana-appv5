import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../../shared/utils/models/cartItems-model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'aldy_cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadCart());
  cartItems$ = this.cartItemsSubject.asObservable();

  private loadCart(): CartItem[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    try {
      const parsed = JSON.parse(data || '[]');
      return parsed.map((item: any) => ({
        ...item,
        quantity: isNaN(Number(item.quantity)) || item.quantity < 1 ? 1 : Number(item.quantity)
      }));
    } catch {
      return [];
    }
  }

  private saveCart(items: CartItem[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  addToCart(item: CartItem) {
    const currentItems = [...this.cartItemsSubject.value];
    const existing = currentItems.find(i => i.id === item.id);

    if (existing) {
      existing.quantity = Math.max(1, existing.quantity + item.quantity);
    } else {
      currentItems.push({ ...item, quantity: Math.max(1, item.quantity) });
    }

    this.cartItemsSubject.next(currentItems);
    this.saveCart(currentItems);
  }

  removeItem(id: string) {
    const updated = this.cartItemsSubject.value.filter(item => item.id !== id);
    this.cartItemsSubject.next(updated);
    this.saveCart(updated);
  }

  updateQuantity(id: string, change: number) {
    const updated = this.cartItemsSubject.value.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    });

    this.cartItemsSubject.next(updated);
    this.saveCart(updated);
  }

  setQuantity(id: string, newQuantity: number) {
    const updated = this.cartItemsSubject.value.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, newQuantity) };
      }
      return item;
    });

    this.cartItemsSubject.next(updated);
    this.saveCart(updated);
  }

  clearCart() {
    this.cartItemsSubject.next([]);
    this.saveCart([]);
  }
}
