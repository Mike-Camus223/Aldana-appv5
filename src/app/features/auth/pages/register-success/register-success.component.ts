import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-success.component.html',
  styleUrls: ['./register-success.component.css']
})
export class RegisterSuccessComponent implements OnInit {
  private supabase: SupabaseClient;
  confirmationStatus: 'checking' | 'success' | 'error' = 'checking';
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  async ngOnInit() {
    try {
      const fragment = window.location.hash;

      if (fragment.includes('access_token')) {
        const { data, error } = await this.supabase.auth.exchangeCodeForSession(fragment);

        if (error) {
          console.error('Error al intercambiar token:', error);
          this.confirmationStatus = 'error';
          this.errorMessage = 'Error al confirmar el correo. Intentalo nuevamente.';
          return;
        }

        console.log('Sesión restaurada correctamente:', data.session);
        this.confirmationStatus = 'success';
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        this.confirmationStatus = 'error';
        this.errorMessage = 'No se encontró token de confirmación en la URL.';
      }
    } catch (error) {
      console.error('Error inesperado al confirmar el correo:', error);
      this.confirmationStatus = 'error';
      this.errorMessage = 'Error inesperado al confirmar el correo.';
    }
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
