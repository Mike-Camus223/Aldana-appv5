import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InputComponent } from '../input/input.component';

@Component({
  selector: 'app-footerv2',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule,InputComponent,FormsModule],
  templateUrl: './footerv2.component.html',
  styleUrl: './footerv2.component.css'
})
export class Footerv2Component {
  readonly tiendaItems = [
    'Camisas',
    'Blusas',
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
      email: ['', [Validators.email]]
    });
  }

  get email() {
    return this.form.get('email');
  }

  normalizeCategory(item: string): string {
    return item.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
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
