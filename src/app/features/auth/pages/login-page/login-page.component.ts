import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { InputpasswordComponent } from '../../../../shared/components/generic/forms/inputpassword/inputpassword.component';

interface LoginForm {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
}

interface ForgotPasswordForm {
  email: FormControl<string | null>;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule, InputComponent, InputpasswordComponent],
  templateUrl: './login-page.component.html'
})
export default class LoginPageComponent {
  isSubmitting = false;
  authError: string | null = null;
  isForgotPassword = false;

  private _fb = inject(FormBuilder);
  private _Router = inject(Router);
  private _authService = inject(AuthService);

  formLogin = this._fb.group<LoginForm>({
    email: this._fb.control(null, [Validators.required, Validators.email]),
    password: this._fb.control(null, [Validators.required]),
  });

  formForgotPassword = this._fb.group<ForgotPasswordForm>({
    email: this._fb.control(null, [Validators.required, Validators.email]),
  });

  async onSubmit(): Promise<void> {
    if (this.formLogin.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    this.authError = null;

    const { email, password } = this.formLogin.value;
    try {
      const result = await this._authService.signIn(email!, password!);
      if (!result.success) {
        this.authError = result.error || 'Error al iniciar sesión';
      }
    } catch (error) {
      this.authError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }

  async onForgotPasswordSubmit(): Promise<void> {
    if (this.formForgotPassword.invalid || this.isSubmitting) return;
    this.isSubmitting = true;

    const { email } = this.formForgotPassword.value;
    try {
      const result = await this._authService.resetPassword(email!);
      if (!result.success) {
        this.authError = result.error || 'No se pudo enviar el correo de recuperación';
      } else {
        this.authError = 'Se enviaron las instrucciones a tu correo';
      }
    } catch (error) {
      this.authError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }

  showForgotPassword(event: Event) {
    event.preventDefault();
    this.isForgotPassword = true;
  }

  backToLogin(event: Event) {
    event.preventDefault();
    this.isForgotPassword = false;
    this.authError = null;
    this.formForgotPassword.reset();
  }
}
