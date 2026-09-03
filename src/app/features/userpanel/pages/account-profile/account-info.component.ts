import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { ModalComponent } from '../../../../shared/components/generic/modal/modal.component';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { User } from '@supabase/supabase-js';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    SelectsComponent,
    ModalComponent,
    LucideAngularModule
  ], templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css']
})
export class AccountInfoComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  accountForm: FormGroup;
  isSaving = false;
  userAvatarUrl: string | null = null;
  displayName = '';
  displayEmail = '';
  createdAtFormatted = 'Mayo 2024';

  // Modal avatar state
  isAvatarModalOpen = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isProcessingFile = false;
  isUploadingAvatar = false;
  isDragging = false;
  isInAvatarCooldown = false;
  avatarCooldownUntil: string | null = null;
  avatarRemainingChanges = 4;

  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private user: User | null = null;
  private authSubscription?: Subscription;

  genderOptions = [
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Otro', value: 'Otro' }
  ];

  constructor(private fb: FormBuilder) {
    this.accountForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+()\s-]{6,20}$/)]],
      gender: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.populateUserData(user);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  getInitial(): string {
    return this.displayName.charAt(0).toUpperCase() || 'U';
  }

  private populateUserData(user: User): void {
    const fullName = user.user_metadata?.['full_name'] || user.user_metadata?.['name'] || '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ') || '';

    // Priorizar avatar_url personalizado y luego picture de Google OAuth
    this.userAvatarUrl = user.user_metadata?.['avatar_url'] || user.user_metadata?.['picture'] || null;

    const phone = user.user_metadata?.['phone'] || user.phone || '';
    const gender = user.user_metadata?.['gender'] || '';

    // Cooldown & intentos
    const now = new Date();
    const cooldownStr = user.user_metadata?.['avatar_cooldown_until'];
    const updatedStr = user.user_metadata?.['avatar_updated_at'];
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    let isCooldown = false;
    if (cooldownStr) {
      const cooldownDate = new Date(cooldownStr);
      if (cooldownDate > now) {
        isCooldown = true;
        this.isInAvatarCooldown = true;
        this.avatarCooldownUntil = cooldownDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } else {
        this.isInAvatarCooldown = false;
        this.avatarCooldownUntil = null;
      }
    } else {
      this.isInAvatarCooldown = false;
      this.avatarCooldownUntil = null;
    }

    let count = user.user_metadata?.['avatar_change_count'] || 0;
    if (updatedStr && !isCooldown) {
      const lastUpdate = new Date(updatedStr).getTime();
      if (now.getTime() - lastUpdate >= SEVEN_DAYS_MS) {
        count = 0;
      }
    }

    this.avatarRemainingChanges = Math.max(0, 4 - count);

    this.accountForm.patchValue({
      firstName,
      lastName,
      email: user.email,
      phone: phone,
      gender: gender
    });

    const full = `${firstName} ${lastName}`.trim();
    this.displayName = full || (user.email ? user.email.split('@')[0] : 'Usuario');
    this.displayEmail = user.email ?? '';

    if (user.created_at) {
      const date = new Date(user.created_at);
      this.createdAtFormatted = date.toLocaleDateString('es-AR', {
        month: 'long',
        year: 'numeric'
      });
      this.createdAtFormatted = this.createdAtFormatted.charAt(0).toUpperCase() + this.createdAtFormatted.slice(1);
    }
  }

  onCancel(): void {
    if (this.user) {
      this.populateUserData(this.user);
      this.accountForm.markAsPristine();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.accountForm.invalid) {
      this.markFormAsTouched();
      this.notificationService.showWarn('Formulario incompleto', 'Por favor verifica los campos requeridos.');
      return;
    }

    if (this.accountForm.pristine) return;

    this.isSaving = true;

    try {
      const { firstName, lastName, phone, gender } = this.accountForm.getRawValue();

      const result = await this.authService.updateUserData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        gender: gender
      });

      if (result.success) {
        this.accountForm.markAsPristine();
        this.displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
        this.notificationService.showSuccess('Cambios guardados', 'Tu información personal ha sido actualizada con éxito.');
      } else {
        this.notificationService.showError('Error al guardar', result.error || 'No se pudieron guardar los cambios en la cuenta.');
      }
    } catch (error: any) {
      this.notificationService.showError('Error de conexión', 'Ocurrió un error inesperado al conectar con el servidor.');
      console.error('Error saving account data:', error);
    } finally {
      this.isSaving = false;
    }
  }

  // --- MODAL AVATAR METHODS ---

  openAvatarModal(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.isProcessingFile = false;
    this.isAvatarModalOpen = true;
  }

  closeAvatarModal(): void {
    this.isAvatarModalOpen = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.isProcessingFile = false;
  }

  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.notificationService.showError('Formato inválido', 'Por favor selecciona una imagen en formato JPG, PNG o WEBP.');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      this.notificationService.showError('Archivo pesado', 'La imagen supera los 5MB permitidos.');
      return;
    }

    this.selectedFile = file;
    this.isProcessingFile = true;
    this.cdr.detectChanges();

    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        this.previewUrl = reader.result as string;
        this.isProcessingFile = false;
        this.cdr.detectChanges();
      }, 300);
    };
    reader.onerror = () => {
      this.isProcessingFile = false;
      this.cdr.detectChanges();
      this.notificationService.showError('Error', 'No se pudo procesar la imagen seleccionada.');
    };
    reader.readAsDataURL(file);
  }

  async uploadSelectedAvatar(): Promise<void> {
    if (!this.selectedFile) return;

    this.isUploadingAvatar = true;
    this.cdr.detectChanges();

    try {
      const result = await this.authService.uploadAvatar(this.selectedFile);

      if (result.success && result.avatarUrl) {
        this.userAvatarUrl = result.avatarUrl;
        this.isAvatarModalOpen = false;
        this.selectedFile = null;
        this.previewUrl = null;
        this.isUploadingAvatar = false;
        this.cdr.detectChanges();
        this.notificationService.showSuccess('Foto de perfil', '¡Tu foto de perfil ha sido actualizada con éxito!');
      } else {
        this.isUploadingAvatar = false;
        this.cdr.detectChanges();
        this.notificationService.showError('Error al subir', result.error || 'No se pudo subir la foto de perfil.');
      }
    } catch (error: any) {
      this.isUploadingAvatar = false;
      this.cdr.detectChanges();
      this.notificationService.showError('Error de subida', 'Ocurrió un error inesperado al subir la foto.');
      console.error('Avatar upload error:', error);
    } finally {
      this.isUploadingAvatar = false;
      this.cdr.detectChanges();
    }
  }

  async removeCurrentAvatar(): Promise<void> {
    this.isUploadingAvatar = true;
    this.cdr.detectChanges();

    try {
      const result = await this.authService.removeAvatar();
      if (result.success) {
        this.userAvatarUrl = null;
        this.isAvatarModalOpen = false;
        this.selectedFile = null;
        this.previewUrl = null;
        this.isUploadingAvatar = false;
        this.cdr.detectChanges();
        this.notificationService.showSuccess('Foto de perfil', 'Tu foto de perfil ha sido eliminada.');
      } else {
        this.isUploadingAvatar = false;
        this.cdr.detectChanges();
        this.notificationService.showError('Error', result.error || 'No se pudo eliminar la foto.');
      }
    } catch (error: any) {
      this.isUploadingAvatar = false;
      this.cdr.detectChanges();
      this.notificationService.showError('Error', 'Ocurrió un error al eliminar la foto.');
    } finally {
      this.isUploadingAvatar = false;
      this.cdr.detectChanges();
    }
  }

  private markFormAsTouched(): void {
    Object.keys(this.accountForm.controls).forEach(field => {
      this.accountForm.get(field)?.markAsTouched();
    });
  }
}