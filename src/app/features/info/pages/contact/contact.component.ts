import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../../../shared/components/generic/forms/input/input.component';
import { TextareaComponent } from '../../../../shared/components/generic/forms/textarea/textarea.component';
import { SelectsComponent } from '../../../../shared/components/generic/forms/selects/selects.component';
import { WordRevealDirective } from '../../../../shared/directives/animations/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../../shared/directives/animations/fadeupletter.directive';
import { BreadcrumbComponent } from '../../../../shared/layouts/components/breadcrumb/breadcrump.component';
import { AppMenuItem } from '../../../../shared/models/app-menu-item.model';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    BreadcrumbComponent,
    InputComponent,
    TextareaComponent,
    SelectsComponent,
    WordRevealDirective,
    FadeUpLetterDirective
  ],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  breadcrumbItems: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'CONTACTO', route: '/contacto' }
  ];

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
      console.log('Contact form submitted:', formData);

      this.contactForm.reset();
      this.submitted = false;
    }
  }
}
