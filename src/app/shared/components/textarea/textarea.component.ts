import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlContainer, FormGroupDirective } from '@angular/forms';

import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TextareaModule, FloatLabelModule],
  templateUrl: './textarea.component.html',
})
export class TextareaComponent {
  @Input() label = '';
  @Input() id = '';
  @Input() formControlName!: string;
  @Input() rows = 5;

  constructor(public controlContainer: ControlContainer) {}

  get control() {
    return this.controlContainer.control?.get(this.formControlName);
  }
}
