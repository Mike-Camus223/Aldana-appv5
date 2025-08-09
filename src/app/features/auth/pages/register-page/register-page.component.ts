import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { passwordStrengthValidator } from '../../../../shared/utils/validators/PasswordStrengthValidator';
import { PasswordMatch } from '../../../../shared/utils/validators/PasswordMatchValidator';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';

interface SignUpForm {
  email: FormControl<null | string>;
  password: FormControl<null | string>;
  repeatpassword: FormControl<null | string>;
  termsAccepted: FormControl<null | boolean>;
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-page.component.html',
})
export default class RegisterPageComponent {
  showPasswordPopover = false;

  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);

  form = this._fb.group<SignUpForm>(
    {
      email: this._fb.control(null, [Validators.required, Validators.email]),
      password: this._fb.control(null, [
        Validators.required,
        Validators.maxLength(20),
        Validators.minLength(6),
        passwordStrengthValidator()
      ]),
      repeatpassword: this._fb.control(null, [Validators.required]),
      termsAccepted: this._fb.control(false, [Validators.requiredTrue]),
    },
    {
      validators: [PasswordMatch('password', 'repeatpassword')]
    }
  );

  get password(): string {
    return this.form.get('password')?.value ?? '';
  }

  get passwordLength(): number {
    return this.password.length;
  }

  get hasMixedCase(): boolean {
    return /[a-z]/.test(this.password) && /[A-Z]/.test(this.password);
  }

  get hasSymbol(): boolean {
    return /[^a-zA-Z0-9]/.test(this.password);
  }

  get passwordStrength(): number {
    let score = 0;
    if (this.passwordLength >= 6) score++;
    if (this.hasMixedCase) score++;
    if (this.hasSymbol) score++;
    return score;
  }

  barColorClass(index: number): string {
    if (this.passwordStrength >= index) {
      if (this.passwordStrength <= 1) return 'bg-red-400';
      if (this.passwordStrength === 2) return 'bg-yellow-400';
      return 'bg-green-400';
    }
    return 'bg-gray-200';
  }

  get passwordErrorMessage(): string {
    const control = this.form.get('password');
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    const keys = Object.keys(errors);

    if (keys.length > 1) {
      return 'La contraseña le falta muchos requisitos para ser válida';
    }

    const errorKey = keys[0];

    const errorMessages: Record<string, string> = {
      required: 'completarse',
      minlength: 'tener al menos 6 caracteres',
      maxlength: 'no excederse más de 20 caracteres',
      passwordStrength: 'caracteres especiales, mayúsculas, etc.'
    };

    return `La contraseña le falta ${errorMessages[errorKey] ?? 'requisitos válidos'}`;
  }

  visibility = {
    password: false,
    repeatPassword: false
  };

  toggleVisibility(field: 'password' | 'repeatPassword') {
    this.visibility[field] = !this.visibility[field];
  }

  get repeatPasswordInvalid(): boolean {
    const control = this.form.get('repeatpassword');
    return (
      ((control?.touched && control.invalid) ?? false) ||
      ((this.form.hasError('passwordNotMatch') && control?.touched) ?? false)
    );
  }

  isSubmitting = false;
  submitError: string | null = null;

}
