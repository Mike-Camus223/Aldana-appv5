import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Pencil } from 'lucide-angular';
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
        Pencil
      })
    }
  ],
  templateUrl: './account-info.component.html'
})
export class AccountInfoComponent implements OnInit {
  accountForm: FormGroup;
  isSaving = false;
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
      lastName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      gender: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  private loadUserData(): void {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.user = user;
        const fullName = user.user_metadata?.['full_name'] || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts.shift() || '';
        const lastName = nameParts.join(' ') || '';

        this.accountForm.patchValue({
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          phone: user.phone || '',
          gender: user.user_metadata?.['gender'] || ''
        });
      }
    });
  }

  onSubmit(): void {
    if (this.accountForm.valid && !this.accountForm.pristine) {
      this.isSaving = true;
      
      // TODO: Implementar la llamada real al servicio de actualización
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

  private markFormAsTouched(): void {
    Object.keys(this.accountForm.controls).forEach(field => {
      const control = this.accountForm.get(field);
      control?.markAsTouched();
    });
  }
}
