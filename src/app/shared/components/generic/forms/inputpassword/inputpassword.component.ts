import { Component, forwardRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-inputpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inputpassword.component.html',
  styleUrls: ['./inputpassword.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputpasswordComponent),
      multi: true
    }
  ]
})
export class InputpasswordComponent implements ControlValueAccessor {
  @Input() label = 'Contraseña';
  @Input() id = 'password';
  @Input() disabled = false;

  value = '';
  showPassword = false;
  invalid = false;

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

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
    this.onTouched();
  }

  toggleVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
