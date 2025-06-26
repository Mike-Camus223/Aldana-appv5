import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentStatusService {
  private paymentSuccess = false;

  setPaymentStatus(status: boolean) {
    this.paymentSuccess = status;
  }

  getPaymentStatus(): boolean {
    return this.paymentSuccess;
  }

  resetPaymentStatus() {
    this.paymentSuccess = false;
  }
}
