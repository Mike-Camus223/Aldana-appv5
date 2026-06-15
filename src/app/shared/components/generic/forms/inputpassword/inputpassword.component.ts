import { Component, Input, Optional, Self } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, ControlValueAccessor, NgControl } from '@angular/forms';
import { Eye, EyeClosed, Lock, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-inputpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,LucideAngularModule],
  templateUrl: './inputpassword.component.html',
  providers: [
      {
        provide: LUCIDE_ICONS,
        multi: true,
        useValue: new LucideIconProvider({
          Lock,
          Eye,
          EyeClosed
        })
      }
    ]
})
export class InputpasswordComponent implements ControlValueAccessor {
  @Input() label = 'Contraseña';
  @Input() id = 'password';
  @Input() disabled = false;

  value = '';
  showPassword = false;
  isFocused = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // Propiedad para manejar estado de validación (igual que InputComponent)
  get invalid(): boolean {
    return !!(this.ngControl?.control?.invalid && this.ngControl?.control?.touched);
  }

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

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  toggleVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}