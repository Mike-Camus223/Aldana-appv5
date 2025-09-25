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

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule, InputComponent,InputpasswordComponent],
  templateUrl: './login-page.component.html'
})
export default class LoginPageComponent {
  toggleIcon: boolean = false;

  private _fb = inject(FormBuilder);
  private _Router = inject(Router);
  private _authService = inject(AuthService);
  isSubmitting = false;
  authError: string | null = null;
  visibilityPass = {
    password: false,
  }

  formLogin = this._fb.group<LoginForm>({
    email: this._fb.control(null, [Validators.required, Validators.email]),
    password: this._fb.control(null, [Validators.required]),
  });

  togglePasswordIcon() {
    this.visibilityPass.password = !this.visibilityPass.password;
  }

  async onSubmit(): Promise<void> {
    if (this.formLogin.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.authError = null;

    const { email, password } = this.formLogin.value;

    if (!email || !password ) {
      this.authError = 'Por favor completa todos los campos';
      this.isSubmitting = false;
      return;
    }

    try {
      const result = await this._authService.signIn(email, password);

      if (!result.success) {
        this.authError = result.error || 'Error al iniciar sesión';
      }
    } catch (error) {
      this.authError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
