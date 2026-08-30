import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { passwordStrengthValidator } from '../../../../shared/utils/validators/PasswordStrengthValidator';
import { PasswordMatch } from '../../../../shared/utils/validators/PasswordMatchValidator';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { InputpasswordComponent } from '../../../../shared/components/generic/forms/inputpassword/inputpassword.component';
import { LucideAngularModule } from 'lucide-angular';

interface SignUpForm {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  repeatPassword: FormControl<string | null>;
  nombre: FormControl<string | null>;
  apellido: FormControl<string | null>;
  birthDay: FormControl<string | null>;
  birthMonth: FormControl<string | null>;
  birthYear: FormControl<string | null>;
  newsletter: FormControl<boolean | null>;
  termsAccepted: FormControl<boolean | null>;
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule, InputComponent, InputpasswordComponent, LucideAngularModule],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css',
  changeDetection: ChangeDetectionStrategy.Eager})
export class RegisterPageComponent {
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _router = inject(Router);

  days = Array.from({ length: 31 }, (_, i) => i + 1);

  months = [
    { value: '1', label: 'Enero' },   { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },   { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },   { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];

  years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  form = this._fb.group<SignUpForm>(
    {
      email: this._fb.control(null, [Validators.required, Validators.email]),
      password: this._fb.control(null, [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(20),
        passwordStrengthValidator()
      ]),
      repeatPassword: this._fb.control(null, [Validators.required]),
      nombre: this._fb.control(null, [Validators.required]),
      apellido: this._fb.control(null, [Validators.required]),
      birthDay: this._fb.control('', [
        Validators.required,
        Validators.pattern(/^(?:[1-9]|[12][0-9]|3[01])$/)
      ]),
      birthMonth: this._fb.control('', [
        Validators.required,
        Validators.pattern(/^(?:[1-9]|1[0-2])$/)
      ]),
      birthYear: this._fb.control('', [
        Validators.required,
        Validators.pattern(/^(19|20)\d{2}$/)
      ]),
      newsletter: this._fb.control(false),
      termsAccepted: this._fb.control(false, [Validators.requiredTrue])},
    {
      validators: [PasswordMatch('password', 'repeatPassword')]
    }
  );

  isSubmitting = false;
  authError: string | null = null;

  get passwordErrorMessage(): string {
    const control = this.form.get('password');
    if (!control?.errors || !control.touched) return '';

    const keys = Object.keys(control.errors);

    if (keys.length > 1) {
      return 'La contraseña le falta muchos requisitos para ser válida';
    }

    const errorMessages: Record<string, string> = {
      required: 'completarse',
      minlength: 'tener al menos 6 caracteres',
      maxlength: 'no excederse más de 20 caracteres',
      passwordStrength: 'incluir caracteres especiales, mayúsculas, etc.'
    };

    return `La contraseña debe ${errorMessages[keys[0]] ?? 'cumplir con los requisitos válidos'}`;
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
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
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

      if (!result.success) {
        this.authError = result.error || 'Error en el registro';
      }
    } catch {
      this.authError = 'Error inesperado al registrar la cuenta';
    } finally {
      this.isSubmitting = false;
    }
  }
}