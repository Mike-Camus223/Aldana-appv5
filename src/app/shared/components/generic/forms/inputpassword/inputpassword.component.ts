import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-inputpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PasswordModule, FloatLabelModule, DividerModule],
  templateUrl: './inputpassword.component.html',
  styleUrl: './inputpassword.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputpasswordComponent),
      multi: true
    }
  ]
})
export class InputpasswordComponent implements ControlValueAccessor {
  @Input() placeholder = 'Contraseña';

  value = '';
  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(value: string): void {
    this.value = value;
    this.onChange(this.value);
    this.onTouched();
  }
}
