import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { InputpasswordComponent } from '../../../../shared/components/generic/forms/inputpassword/inputpassword.component';
import { Subscription } from 'rxjs';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Mail } from 'lucide-angular';

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
  imports: [RouterModule, ReactiveFormsModule, CommonModule, InputComponent, InputpasswordComponent,LucideAngularModule],
  templateUrl: './login-page.component.html',
  providers: [
        {
          provide: LUCIDE_ICONS,
          multi: true,
          useValue: new LucideIconProvider({
            Mail
          })
        }
      ]
})
export class LoginPageComponent implements OnInit, OnDestroy {
  isSubmitting = false;
  authError: string | null = null;
  isForgotPassword = false;

  private _fb = inject(FormBuilder);
  private _Router = inject(Router);
  private _authService = inject(AuthService);
  private _subs: Subscription = new Subscription();


  formLogin = this._fb.group<LoginForm>({
    email: this._fb.control(null, [Validators.required, Validators.email]),
    password: this._fb.control(null, [
  Validators.required,
  Validators.minLength(6)
]),
  });

  formForgotPassword = this._fb.group<ForgotPasswordForm>({
    email: this._fb.control(null, [Validators.required, Validators.email]),
  });

  // LOGIN SUBMIT
  async onSubmit(): Promise<void> {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched(); 
      return;
    }

    this.isSubmitting = true;
    this.authError = null;

    const { email, password } = this.formLogin.value;

    try {
      const result = await this._authService.signIn(email!, password!);
      if (!result.success) {
        this.authError = result.error || 'Error al iniciar sesión';
      }
    } catch {
      this.authError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }

  ngOnInit(): void {
  const sub = this.formLogin.valueChanges.subscribe(() => {
    if (this.authError) {
      this.authError = null;
    }
  });
  this._subs.add(sub);
}

ngOnDestroy(): void {
  this._subs.unsubscribe();
}


  // SOCIAL LOGIN
  async onGoogleLogin(): Promise<void> {
    await this.handleOAuth('google');
  }

  async onFacebookLogin(): Promise<void> {
    await this.handleOAuth('facebook');
  }

  async onAppleLogin(): Promise<void> {
    await this.handleOAuth('apple');
  }

  private async handleOAuth(provider: 'google' | 'facebook' | 'apple') {
    try {
      await this._authService.signInWithOAuth(provider);
    } catch {
      this.authError = `No se pudo iniciar sesión con ${provider}.`;
    }
  }

  // FORGOT PASSWORD SUBMIT
  async onForgotPasswordSubmit(): Promise<void> {
    if (this.formForgotPassword.invalid) {
      this.formForgotPassword.markAllAsTouched(); // <<--- fuerza required
      return;
    }

    this.isSubmitting = true;
    const { email } = this.formForgotPassword.value;

    try {
      const result = await this._authService.resetPassword(email!);
      if (!result.success) {
        this.authError = result.error || 'No se pudo enviar el correo de recuperación';
      } else {
        this.authError = 'Se enviaron las instrucciones a tu correo';
      }
    } catch {
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
