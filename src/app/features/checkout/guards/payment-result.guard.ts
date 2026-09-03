import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentStatusService } from '../services/payment-status.service';

export const paymentsuccesguardGuard: CanActivateFn = (route, state) => {
  const paymentService = inject(PaymentStatusService);
  const router = inject(Router);

  if (paymentService.getPaymentStatus()) {
    paymentService.resetPaymentStatus();
    return true;
  } else {
    router.navigate(['/checkout/pago']);
    return false;
  }
};
