export interface PaymentRejectionInfo {
  title: string;
  message: string;
  tip: string;
  badge: string;
}

/**
 * Mapea los códigos de detalle de Mercado Pago (status_detail) y comentarios del sistema
 * a explicaciones amigables y recomendaciones claras en español.
 */
export function getPaymentRejectionInfo(statusDetail?: string, comment?: string): PaymentRejectionInfo {
  const detail = (statusDetail || '').toLowerCase().trim();
  const c = (comment || '').toLowerCase().trim();

  // 1. Fondos insuficientes
  if (detail.includes('insufficient_amount') || c.includes('insufficient_amount') || detail.includes('fund') || c.includes('fund')) {
    return {
      title: 'Fondos insuficientes',
      message: 'El emisor de la tarjeta indicó que no posee saldo suficiente para completar esta operación.',
      tip: 'Probá abonar con otra tarjeta de crédito o débito, o seleccioná una cantidad de cuotas distinta.',
      badge: 'Saldo insuficiente'
    };
  }

  // 2. Requiere autorización telefónica
  if (detail.includes('call_for_authorize') || c.includes('call_for_authorize') || detail.includes('call') || c.includes('call')) {
    return {
      title: 'Autorización bancaria requerida',
      message: 'Tu banco solicitó que te comuniques telefónicamente para autorizar este pago antes de proceder.',
      tip: 'Llamá al número de atención al cliente que figura al dorso de tu tarjeta para autorizar el cobro, o bien intentá con otra tarjeta.',
      badge: 'Requiere autorización'
    };
  }

  // 3. Código de seguridad incorrecto
  if (detail.includes('bad_filled_security_code') || c.includes('security_code') || detail.includes('secu') || c.includes('secu')) {
    return {
      title: 'Código de seguridad inválido',
      message: 'El código de seguridad (CVV) ingresado no coincide con el de tu tarjeta.',
      tip: 'Verificá los 3 dígitos al dorso de tu tarjeta (o 4 dígitos al frente si es American Express).',
      badge: 'CVV incorrecto'
    };
  }

  // 4. Fecha de vencimiento
  if (detail.includes('bad_filled_date') || detail.includes('expired') || c.includes('expi')) {
    return {
      title: 'Fecha de vencimiento incorrecta',
      message: 'La fecha de vencimiento ingresada no es válida o la tarjeta se encuentra vencida.',
      tip: 'Revisá el mes y año grabados en el frente de tu tarjeta.',
      badge: 'Vencimiento inválido'
    };
  }

  // 5. Datos de tarjeta / Número
  if (detail.includes('bad_filled_other') || detail.includes('card_number') || c.includes('card')) {
    return {
      title: 'Datos de tarjeta inválidos',
      message: 'El número de tarjeta ingresado no es válido.',
      tip: 'Revisá cuidadosamente los 16 dígitos de tu tarjeta e intentalo nuevamente.',
      badge: 'Datos incorrectos'
    };
  }

  // 6. Tarjeta inhabilitada / Bloqueada
  if (detail.includes('card_disabled') || detail.includes('locked') || c.includes('lock')) {
    return {
      title: 'Tarjeta no habilitada',
      message: 'Tu tarjeta no está habilitada para realizar compras en línea o fue bloqueada por tu banco.',
      tip: 'Podés habilitar compras por internet desde el homebanking de tu banco o utilizar otra tarjeta.',
      badge: 'Tarjeta inhabilitada'
    };
  }

  // 7. Pagos duplicados
  if (detail.includes('duplicated_payment') || c.includes('dupl')) {
    return {
      title: 'Posible pago duplicado',
      message: 'Mercado Pago detectó un intento de pago idéntico en los últimos minutos.',
      tip: 'Revisá la sección de mis pedidos para confirmar si tu orden previa ya fue procesada con éxito.',
      badge: 'Intento duplicado'
    };
  }

  // 8. Intentos excedidos
  if (detail.includes('max_attempts') || c.includes('atte')) {
    return {
      title: 'Límite de intentos excedido',
      message: 'Se superó la cantidad máxima de intentos con esta tarjeta.',
      tip: 'Por seguridad, te sugerimos utilizar otra tarjeta o esperar unos minutos antes de reintentar.',
      badge: 'Intentos excedidos'
    };
  }

  // 9. Caso por defecto (error general del banco / scoring)
  return {
    title: 'Pago no autorizado por el emisor',
    message: 'El banco emisor de la tarjeta no autorizó la transacción.',
    tip: 'Te recomendamos intentar con otra tarjeta de crédito o débito, o consultar con tu banco.',
    badge: 'Rechazado por banco'
  };
}
