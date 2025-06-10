import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlContainer } from '@angular/forms';

import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-inputpassword',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PasswordModule, DividerModule],
  templateUrl: './inputpassword.component.html',
  styleUrl: './inputpassword.component.css'
})
export class InputpasswordComponent {
 @Input() formControlName!: string;

  constructor(public controlContainer: ControlContainer) {}

  get control() {
    return this.controlContainer.control?.get(this.formControlName);
  }
}
