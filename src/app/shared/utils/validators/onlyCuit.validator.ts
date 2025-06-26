import { AbstractControl, ValidationErrors } from '@angular/forms';

export function onlyCuitValidator(control: AbstractControl): ValidationErrors | null {
  const rawValue = control.value || '';
  const numericValue = rawValue.replace(/\D/g, '');

  if (!numericValue) return null;

  if (numericValue.length !== 11) return { invalidCuit: true };

  if (!/^\d{11}$/.test(numericValue)) return { invalidCuit: true };

  const validPrefixes = ['20', '23', '24', '27', '30', '33', '34'];
  const prefix = numericValue.substring(0, 2);

  if (!validPrefixes.includes(prefix)) return { invalidCuit: true };

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = numericValue.split('').map(Number);
  const checksum = digits
    .slice(0, 10)
    .reduce((acc: number, digit: number, i: number) => acc + digit * multipliers[i], 0);

  const mod11 = checksum % 11;
  let expectedDigit = 11 - mod11;
  if (expectedDigit === 11) expectedDigit = 0;
  else if (expectedDigit === 10) expectedDigit = 9;

  return digits[10] === expectedDigit ? null : { invalidCuit: true };
}
