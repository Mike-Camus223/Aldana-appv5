import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../generic/forms/input/input.component';
import { TextareaComponent } from '../../generic/forms/textarea/textarea.component';
import { SelectsComponent } from '../../generic/forms/selects/selects.component';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';

@Component({
  selector: 'app-contact-template',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    TextareaComponent,
    SelectsComponent,
    WordRevealDirective,
    FadeUpLetterDirective,
    CardInitAnimationDirective
],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './contact-template.component.html',
})
export class ContactTemplateComponent {

  contactForm: FormGroup;
  submitted = false;

  departments = [
    { label: 'Ventas', value: 'sales' },
    { label: 'Atención al cliente', value: 'support' },
    { label: 'Envios', value: 'delivery' },
    { label: 'Otros', value: 'other' }
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

  isInvalid(field: string): boolean {
    const control = this.contactForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      console.log(formData);

      this.contactForm.reset();
      this.submitted = false;
    }
  }
}