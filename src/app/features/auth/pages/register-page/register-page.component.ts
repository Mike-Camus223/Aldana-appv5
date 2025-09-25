import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { passwordStrengthValidator } from '../../../../shared/utils/validators/PasswordStrengthValidator';
import { PasswordMatch } from '../../../../shared/utils/validators/PasswordMatchValidator';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { ConfirmationGuard } from '../../../../core/guards/confirmation.guard';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { InputpasswordComponent } from '../../../../shared/components/generic/forms/inputpassword/inputpassword.component';

interface SignUpForm {
  email: FormControl<null | string>;
  password: FormControl<null | string>;
  repeatPassword: FormControl<null | string>;
  nombre: FormControl<null | string>;
  apellido: FormControl<null | string>;
  newsletter: FormControl<null | boolean>;
  termsAccepted: FormControl<null | boolean>;
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule, InputComponent, InputpasswordComponent],
  templateUrl: './register-page.component.html',
})
export default class RegisterPageComponent {
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
      repeatPassword: this._fb.control(null, [Validators.required]),
      nombre: this._fb.control(null, [Validators.required]),
      apellido: this._fb.control(null, [Validators.required]),
      newsletter: this._fb.control(false),
      termsAccepted: this._fb.control(false, [Validators.requiredTrue]),
    },
    {
      validators: [PasswordMatch('password', 'repeatPassword')]
    }
  );

  isSubmitting = false;
  authError: string | null = null;

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

    return `La contraseña debe ${errorMessages[errorKey] ?? 'cumplir con los requisitos válidos'}`;
  }

  get repeatPasswordErrorMessage(): string {
    const control = this.form.get('repeatPassword');
    if (!control?.touched) return '';

    if (control.errors?.['required']) {
      return 'Debes repetir la contraseña';
    }

    if (this.form.errors?.['passwordNotMatch']) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.authError = null;

    try {
      const result = await this._authService.signUp(
        this.form.get('email')?.value ?? '',
        this.form.get('password')?.value ?? ''
      );

      if (result.success) {
        // Establecer el estado de confirmación antes de redirigir
        ConfirmationGuard.setConfirmationState('register-confirm');
        this._router.navigate(['/register-confirm']);
      } else {
        this.authError = result.error || 'Error en el registro';
      }
    } catch (error) {
      this.authError = 'Error inesperado al registrar la cuenta';
      console.error('Error en registro:', error);
    } finally {
      this.isSubmitting = false;
    }
  }
}