import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../input/input.component';
import { TextareaComponent } from '../textarea/textarea.component';
import { SelectsComponent } from '../selects/selects.component';

@Component({
  selector: 'app-contact-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    TextareaComponent,
    SelectsComponent
  ],
  templateUrl: './contact-template.component.html',
})
export class ContactTemplateComponent {
  contactForm: FormGroup;
  departments = [
    { label: 'Ventas', value: 'sales' },
    { label: 'Atención al cliente', value: 'support' },
    { label: 'Prensa', value: 'press' }
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+?\d{7,15})$/)]],
      department: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log('Form submitted:', formData);
      this.contactForm.reset();
    }
  }
}
