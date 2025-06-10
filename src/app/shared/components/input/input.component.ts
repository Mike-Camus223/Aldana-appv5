import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlContainer } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputTextModule, FloatLabelModule],
  templateUrl: './input.component.html',
})
export class InputComponent {
  @Input() label = '';
  @Input() id = '';
  @Input() formControlName!: string;

  constructor(public controlContainer: ControlContainer) {}

  get control() {
    return this.controlContainer.control?.get(this.formControlName);
  }
}
