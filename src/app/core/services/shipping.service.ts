import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ShippingData {
  name: string;
  surname: string;
  address: string;
  apartment?: string;
  zipCode: string;
  neighborhood?: string;
  city: string;
  province: string;
  phone: string;
  invoiceToCompany?: boolean;
  dniOrCuit?: string | null;
  razonSocial?: string | null;
  email: string;
}

export interface DiscountData {
  code: string;
  discountAmount: number; 
  discountType: 'percent' | 'fixed';
}



@Injectable({ providedIn: 'root' })
export class ShippingService {
  private shippingDataSubject = new BehaviorSubject<ShippingData | null>(null);
  shippingData$ = this.shippingDataSubject.asObservable();

  setShippingData(data: ShippingData) {
    this.shippingDataSubject.next(data);
  }

  getShippingData(): ShippingData | null {
    return this.shippingDataSubject.value;
  }

  clear() {
    this.shippingDataSubject.next(null);
  }

  private discountDataSubject = new BehaviorSubject<DiscountData | null>(null);
  discountData$ = this.discountDataSubject.asObservable();

  setDiscountData(data: DiscountData | null) {
    this.discountDataSubject.next(data);
  }

  getDiscountData(): DiscountData | null {
    return this.discountDataSubject.value;
  }
}
