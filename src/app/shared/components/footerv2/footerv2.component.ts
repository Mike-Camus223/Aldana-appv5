import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-footerv2',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './footerv2.component.html',
  styleUrl: './footerv2.component.css'
})
export class Footerv2Component {
  readonly tiendaItems = [
    'Camisas y Blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos'
  ];

  readonly form: FormGroup;
  submitted = false;
  success = false;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.form.get('email');
  }

  formatRoute(item: string): string {
    return '/' + item.toLowerCase().replace(/\s+/g, '-');
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.valid) {
      this.success = true;
      console.log('Email enviado:', this.email?.value);

      this.form.reset();
      setTimeout(() => (this.success = false), 3000);
    }
  }
}
