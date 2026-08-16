import { Component, OnInit } from '@angular/core';

import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [RouterModule],
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
      // Buscar en ambos query params y hash
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Buscar token en ambos lugares
      const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
      const type = searchParams.get('type') || hashParams.get('type');

      if (accessToken && type === 'signup') {
        const { data, error } = await this.supabase.auth.exchangeCodeForSession(window.location.search + window.location.hash);

        if (error) {
          console.error('Error al intercambiar token:', error);
          this.confirmationStatus = 'error';
          this.errorMessage = 'Error al confirmar el correo. Intentalo nuevamente.';
          return;
        }

        console.log('Sesión restaurada correctamente:', data.session);
        this.confirmationStatus = 'success';
        
        // Limpiar URL completa
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
    this.router.navigate(['/']);
  }
}
