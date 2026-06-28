import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { Calendar, ChevronRight, Lock, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Mail, MapPin, Pencil } from 'lucide-angular';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { take } from 'rxjs';

@Component({
  selector: 'app-account-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    SelectsComponent,
    LucideAngularModule
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Pencil, Mail, Calendar, Lock, MapPin, ChevronRight
      })
    }
  ],
  templateUrl: './account-info.component.html'
})
export class AccountInfoComponent implements OnInit {

  accountForm: FormGroup;
  isSaving = false;
  userAvatarUrl: string | null = null;
  displayName = '';
  displayEmail = '';

  private authService = inject(AuthService);
  private user: User | null = null;

  genderOptions = [
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Otro', value: 'Otro' }
  ];

  constructor(private fb: FormBuilder) {
    this.accountForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName:  ['', [Validators.required]],
      email:     ['', [Validators.required, Validators.email]],
      phone:     ['', [Validators.required]],
      gender:    ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  getInitial(): string {
    return this.displayName.charAt(0).toUpperCase() || 'U';
  }

  onCancel(): void {
    this.accountForm.reset();
    this.displayName = '';
    this.displayEmail = '';
  }

  onSubmit(): void {
    if (this.accountForm.valid && !this.accountForm.pristine) {
      this.isSaving = true;
      setTimeout(() => {
        console.log('Form submitted:', this.accountForm.value);
        this.accountForm.markAsPristine();
        this.isSaving = false;
        alert('¡Cambios guardados exitosamente! (Simulado)');
      }, 1000);
    } else {
      this.markFormAsTouched();
    }
  }

  private loadUserData(): void {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.user = user;
        const fullName = user.user_metadata?.['full_name'] || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts.shift() || '';
        const lastName = nameParts.join(' ') || '';
        this.userAvatarUrl = user.user_metadata?.['avatar_url'] || null;

        this.accountForm.patchValue({
          firstName,
          lastName,
          email:  user.email,
          phone:  user.phone || '',
          gender: user.user_metadata?.['gender'] || ''
        });

        this.displayName  = firstName;
        this.displayEmail = user.email ?? '';
      }
    });
  }

  private markFormAsTouched(): void {
    Object.keys(this.accountForm.controls).forEach(field => {
      this.accountForm.get(field)?.markAsTouched();
    });
  }
}