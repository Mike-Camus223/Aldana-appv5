import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './textarea.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ]
})
export class TextareaComponent implements ControlValueAccessor {

  @Input() label = '';
  @Input() id = '';
  @Input() rows = 5;
  @Input() invalid = false;

  value = '';
  disabled = false;

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

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value = val;
    this.onChange(val);
  }
}