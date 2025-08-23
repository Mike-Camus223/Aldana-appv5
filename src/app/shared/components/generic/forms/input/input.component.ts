import { CommonModule } from '@angular/common';
import { Component, Input, Optional, Self } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, InputTextModule, FloatLabelModule, FormsModule],
  templateUrl: './input.component.html'
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() id = '';
  @Input() disabled = false;
  @Input() numericMax11 = false;


  value = '';
  onChange = (_: any) => { };
  onTouched = () => { };

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (ngControl) {
      ngControl.valueAccessor = this;
    }
  }

  get invalid(): boolean {
    return !!(this.ngControl?.control?.invalid && this.ngControl?.control?.dirty);
  }

  writeValue(value: any): void {
    this.value = value ?? '';
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  let value = input.value;

  if (this.numericMax11) {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 8) {
      formatted = raw.replace(/^(\d{2})(\d{8})(\d{0,1})$/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join('-')
      );
    }
    value = formatted;
    input.value = value;
  }

  this.value = value;
  this.onChange(this.value);
}



}
