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


}
