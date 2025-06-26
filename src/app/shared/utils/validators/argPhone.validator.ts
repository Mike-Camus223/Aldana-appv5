import { AbstractControl, ValidationErrors } from '@angular/forms';

export function argPhoneValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value;

  if (!value) return null;

  if (/[a-zA-Z]/.test(value)) {
    return { invalidPhone: true };
  }

  const cleaned = value.replace(/[\s()-]/g, '').replace(/^\+/, '');
  const numeric = cleaned.replace(/\D/g, '');

  const normalized = numeric.startsWith('54') ? numeric.slice(2) : numeric;

  if (/^\d{10,11}$/.test(normalized)) {
    return null;
  }

  return { invalidPhone: true };
}
