import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const resultScreenGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const status = route.queryParams['status'];
  const orderId = route.queryParams['orderId'];

  // Si tiene status y orderId, permitimos el acceso
  if (status && orderId) {
    return true;
  } else {
    // Si no, redirigir a la tienda
    router.navigate(['/']);
    return false;
  }
};
