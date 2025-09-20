import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '../../shared/utils/models/cartItems-model';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'aldy_cart';
  private readonly COOKIE_DAYS = 30;
  private cartItemsSubject!: BehaviorSubject<CartItem[]>;
  cartItems$!: Observable<CartItem[]>;
  
  // Almacenamiento en memoria para cuando no hay cookies/localStorage
  private memoryStorage = new Map<string, any>();
  private isCookieAvailable = false;
  private isLocalStorageAvailable = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookieService: CookieService
  ) {
    this.checkStorageAvailability();
    this.cartItemsSubject = new BehaviorSubject<CartItem[]>(this.loadCart());
    this.cartItems$ = this.cartItemsSubject.asObservable();
  }

  private checkStorageAvailability(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Verificar cookies
    try {
      this.cookieService.set('test', '1', 1);
      this.isCookieAvailable = this.cookieService.get('test') === '1';
      this.cookieService.delete('test');
    } catch {
      this.isCookieAvailable = false;
    }
    
    // Verificar localStorage
    try {
      localStorage.setItem('test', '1');
      this.isLocalStorageAvailable = localStorage.getItem('test') === '1';
      localStorage.removeItem('test');
    } catch {
      this.isLocalStorageAvailable = false;
    }
  }

  getCart(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  private loadCart(): CartItem[] {
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR, usar memoria temporal
      const memoryData = this.memoryStorage.get(this.STORAGE_KEY);
      return memoryData || [];
    }
    
    let cartData = null;
    
    // Intentar localStorage primero (más confiable)
    if (this.isLocalStorageAvailable) {
      try {
        cartData = localStorage.getItem(this.STORAGE_KEY);
      } catch {
        // localStorage falló, continuar
      }
    }
    
    // Si no hay localStorage, intentar cookies
    if (!cartData && this.isCookieAvailable) {
      try {
        cartData = this.cookieService.get(this.STORAGE_KEY);
      } catch {
        // Cookies fallaron, continuar
      }
    }
    
    // Si todo falla, usar memoria
    if (!cartData) {
      cartData = this.memoryStorage.get(this.STORAGE_KEY) || '[]';
    }
    
    try {
      const parsed = JSON.parse(cartData || '[]');
      return parsed.map((item: any) => ({
        ...item,
        quantity: isNaN(Number(item.quantity)) || item.quantity < 1 ? 1 : Number(item.quantity)
      }));
    } catch {
      return [];
    }
  }

  private saveCart(items: CartItem[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR, guardar en memoria
      this.memoryStorage.set(this.STORAGE_KEY, JSON.stringify(items));
      return;
    }
    
    const cartData = JSON.stringify(items);
    
    // Guardar en localStorage primero (preferido)
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(this.STORAGE_KEY, cartData);
      } catch {
        // localStorage lleno o error
      }
    }
    
    // Guardar en cookies como backup
    if (this.isCookieAvailable) {
      try {
        this.cookieService.set(this.STORAGE_KEY, cartData, this.COOKIE_DAYS, '/');
      } catch {
        // Cookies llenas o error
      }
    }
    
    // Siempre guardar en memoria como último recurso
    this.memoryStorage.set(this.STORAGE_KEY, cartData);
  }

  addToCart(item: CartItem): void {
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

  removeItem(id: string): void {
    const updated = this.cartItemsSubject.value.filter(item => item.id !== id);
    this.cartItemsSubject.next(updated);
    this.saveCart(updated);
  }

  updateQuantity(id: string, change: number): void {
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

  setQuantity(id: string, newQuantity: number): void {
    const updated = this.cartItemsSubject.value.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, newQuantity) };
      }
      return item;
    });

    this.cartItemsSubject.next(updated);
    this.saveCart(updated);
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
    
    if (isPlatformBrowser(this.platformId)) {
      if (this.isLocalStorageAvailable) {
        try {
          localStorage.removeItem(this.STORAGE_KEY);
        } catch {}
      }
      
      if (this.isCookieAvailable) {
        try {
          this.cookieService.delete(this.STORAGE_KEY, '/');
        } catch {}
      }
    }
    
    this.memoryStorage.delete(this.STORAGE_KEY);
  }

  getItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  // Método para sincronizar desde el servidor (útil para SSR)
  syncFromServer(serverCart: CartItem[]): void {
    const currentCart = this.cartItemsSubject.value;
    
    // Si el servidor tiene datos y el cliente está vacío, usar datos del servidor
    if (serverCart.length > 0 && currentCart.length === 0) {
      this.cartItemsSubject.next(serverCart);
      this.saveCart(serverCart);
    }
  }
}
