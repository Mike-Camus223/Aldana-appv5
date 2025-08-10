import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export default class AccountComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isUpdatingProfile = false;
  isUpdatingPassword = false;
  profileMessage: string | null = null;
  passwordMessage: string | null = null;
  private userSubscription?: Subscription;

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  constructor() {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.checkAuthentication();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Verifica si el usuario está autenticado
   */
  private checkAuthentication(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loadUserData();
      }
    });
  }

  /**
   * Carga los datos del usuario en el formulario
   */
  private loadUserData(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        email: this.currentUser.email,
        firstName: this.currentUser.user_metadata?.['firstName'] || '',
        lastName: this.currentUser.user_metadata?.['lastName'] || ''
      });
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  async onUpdateProfile(): Promise<void> {
    if (this.profileForm.invalid) return;

    this.isUpdatingProfile = true;
    this.profileMessage = null;

    try {
      // Aquí se implementaría la actualización del perfil en Supabase
      // Por ahora simulamos la operación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.profileMessage = 'Perfil actualizado correctamente';
      setTimeout(() => this.profileMessage = null, 3000);
    } catch (error) {
      this.profileMessage = 'Error al actualizar el perfil';
    } finally {
      this.isUpdatingProfile = false;
    }
  }

  /**
   * Actualiza la contraseña del usuario
   */
  async onUpdatePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;

    const { newPassword, confirmPassword } = this.passwordForm.value;
    
    if (newPassword !== confirmPassword) {
      this.passwordMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isUpdatingPassword = true;
    this.passwordMessage = null;

    try {
      // Aquí se implementaría la actualización de contraseña en Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.passwordMessage = 'Contraseña actualizada correctamente';
      this.passwordForm.reset();
      setTimeout(() => this.passwordMessage = null, 3000);
    } catch (error) {
      this.passwordMessage = 'Error al actualizar la contraseña';
    } finally {
      this.isUpdatingPassword = false;
    }
  }

  /**
   * Navega de vuelta al panel principal
   */
  goBackToPanel(): void {
    this.router.navigate(['/user-panel']);
  }
}
