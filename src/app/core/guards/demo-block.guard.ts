import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

/**
 * Guard para la versión DEMO que bloquea el acceso a secciones restringidas
 * (Checkout, registro tradicional, confirmaciones, etc.), muestra una notificación
 * reutilizando el NotificationService del proyecto y redirige a Home ('/').
 */
export const demoBlockGuard: CanActivateFn = () => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  notificationService.showWarn('Demo limitada', 'No puedes acceder a esta sección.');
  return router.createUrlTree(['/']);
};

export const demoBlockChildGuard: CanActivateChildFn = () => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  notificationService.showWarn('Demo limitada', 'No puedes acceder a esta sección.');
  return router.createUrlTree(['/']);
};
