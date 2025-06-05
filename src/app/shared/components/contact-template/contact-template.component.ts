import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabel } from 'primeng/floatlabel';


@Component({
  selector: 'app-contact-template',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ReactiveFormsModule,
    FloatLabel
  ],
  templateUrl: './contact-template.component.html',
  styleUrls: ['./contact-template.component.css']
})
export class ContactTemplateComponent {
  displayContactDialog = false;

  contactForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\\+?[0-9\\s]{7,15}$/)]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log('Formulario enviado:', formData);

      this.contactForm.reset();
      this.displayContactDialog = false;
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.contactForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  getErrorMessage(controlName: string): string {
    const control = this.contactForm.get(controlName);
    if (control?.hasError('required')) return 'Este campo es obligatorio.';
    if (control?.hasError('email')) return 'Formato de correo inválido.';
    if (control?.hasError('minlength')) return `Debe tener al menos ${control.getError('minlength').requiredLength} caracteres.`;
    if (control?.hasError('pattern')) return 'Formato no válido.';
    return '';
  }

}
