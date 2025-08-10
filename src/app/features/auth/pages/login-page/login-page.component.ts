import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

interface Loginform {
  email: FormControl<null | string>;
  password: FormControl<null | string>;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login-page.component.html'
})
export default class LoginPageComponent {
  toggleIcon: boolean = false;

  private _fb = inject(FormBuilder);
  private _Router = inject(Router);
  private _authService = inject(AuthService);

  formLogin = this._fb.group<Loginform>({
    email: this._fb.control(null, [Validators.required, Validators.email]),
    password: this._fb.control(null, [Validators.required])
  });

  visibilityPass = {
    password: false,
  }

  togglePasswordIcon() {
    this.visibilityPass.password = !this.visibilityPass.password;
  }

  isSubmitting = false;
  authError: string | null = null;

  /**
   * Maneja el envío del formulario de login
   */
  async onSubmit(): Promise<void> {
    if (this.formLogin.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.authError = null;

    const { email, password } = this.formLogin.value;

    if (!email || !password) {
      this.authError = 'Por favor completa todos los campos';
      this.isSubmitting = false;
      return;
    }

    try {
      const result = await this._authService.signIn(email, password);
      
      if (!result.success) {
        this.authError = result.error || 'Error al iniciar sesión';
      }
      // Si es exitoso, el AuthService ya redirige al panel
    } catch (error) {
      this.authError = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
