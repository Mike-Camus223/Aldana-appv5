import { AbstractControl, ValidationErrors } from '@angular/forms';

export function cpaArg(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.toUpperCase?.().trim();

  const oldFormat = /^[0-9]{4}$/;

  const newFormat = /^[A-Z][0-9]{4}[A-Z]{3}$/;

  if (!value) return null;

  if (oldFormat.test(value) || newFormat.test(value)) {
    return null;
  }

  return { invalidPostalCode: true };
}
