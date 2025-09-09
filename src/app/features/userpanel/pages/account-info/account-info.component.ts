import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Pencil } from 'lucide-angular';

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
  
  genderOptions = [
    { label: 'Femenino', value: 'Femenino' },
    { label: 'Masculino', value: 'Masculino' },
    { label: 'Otro', value: 'Otro' }
  ];

  constructor(private fb: FormBuilder) {
    this.accountForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      gender: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Load user data here if needed
    // Example: this.loadUserData();
  }

  onSubmit(): void {
    if (this.accountForm.valid && !this.accountForm.pristine) {
      this.isSaving = true;
      
      // Simulate API call (replace with actual API call)
      setTimeout(() => {
        console.log('Form submitted:', this.accountForm.value);
        // Handle successful save
        this.accountForm.markAsPristine();
        this.isSaving = false;
        
        // Show success message (you can implement a toast/notification service)
        alert('¡Cambios guardados exitosamente!');
      }, 1000);
    } else {
      // Mark all fields as touched to show validation messages
      Object.keys(this.accountForm.controls).forEach(field => {
        const control = this.accountForm.get(field);
        control?.markAsTouched();
      });
    }
  }
}
