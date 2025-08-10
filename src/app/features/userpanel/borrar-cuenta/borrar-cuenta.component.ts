import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-borrar-cuenta',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './borrar-cuenta.component.html',
  styleUrls: ['./borrar-cuenta.component.css']
})
export default class BorrarCuentaComponent implements OnInit {
  currentUser: User | null = null;
  confirmationForm: FormGroup;
  isDeleting = false;
  errorMessage: string | null = null;
  showConfirmation = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.confirmationForm = this.fb.group({
      confirmText: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  private checkAuthentication(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Muestra el formulario de confirmación
   */
  showConfirmationForm(): void {
    this.showConfirmation = true;
  }

  /**
   * Cancela el proceso de eliminación
   */
  cancelDeletion(): void {
    this.showConfirmation = false;
    this.confirmationForm.reset();
    this.errorMessage = null;
  }

  /**
   * Elimina la cuenta del usuario
   */
  async onDeleteAccount(): Promise<void> {
    if (this.confirmationForm.invalid) return;

    const { confirmText } = this.confirmationForm.value;
    
    if (confirmText !== 'ELIMINAR') {
      this.errorMessage = 'Debes escribir "ELIMINAR" para confirmar';
      return;
    }

    this.isDeleting = true;
    this.errorMessage = null;

    try {
      const result = await this.authService.deleteAccount();
      
      if (!result.success) {
        this.errorMessage = result.error || 'Error al eliminar la cuenta';
        return;
      }

      // La cuenta se eliminó exitosamente, el AuthService ya redirige al home
    } catch (error) {
      this.errorMessage = 'Error inesperado al eliminar la cuenta';
    } finally {
      this.isDeleting = false;
    }
  }

  /**
   * Navega de vuelta al panel principal
   */
  goBackToPanel(): void {
    this.router.navigate(['/user-panel']);
  }
}
