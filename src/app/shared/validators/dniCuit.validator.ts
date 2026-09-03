import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dniCuitValidator(control: AbstractControl): ValidationErrors | null {
  const rawValue = control.value || '';
  const numericValue = rawValue.replace(/\D/g, '');

  if (!numericValue) return null;

  if (numericValue.length >= 7 && numericValue.length <= 8) {
    if (!/^\d{7,8}$/.test(numericValue)) return { invalidDni: true };
    return null;
  }

  if (numericValue.length === 11) {
    if (!isValidCuit(numericValue)) return { invalidCuit: true };
    return null;
  }

  return { invalidDniCuit: true };
}

function isValidCuit(cuit: string): boolean {
  if (!/^\d{11}$/.test(cuit)) return false;

  const validPrefixes = ['20', '23', '24', '27', '30', '33', '34'];
  const prefix = cuit.substring(0, 2);

  if (!validPrefixes.includes(prefix)) return false;

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = cuit.split('').map(Number);
  const checksum = digits
    .slice(0, 10)
    .reduce((acc, digit, i) => acc + digit * multipliers[i], 0);

  const mod11 = checksum % 11;
  let expectedDigit = 11 - mod11;
  if (expectedDigit === 11) expectedDigit = 0;
  else if (expectedDigit === 10) expectedDigit = 9;

  return digits[10] === expectedDigit;
}
