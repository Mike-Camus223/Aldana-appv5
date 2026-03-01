import {
  Component,
  Input,
  Optional,
  Self
} from '@angular/core';

import {
  ControlValueAccessor,
  NgControl,
  ControlContainer
} from '@angular/forms';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './textarea.component.html'
})
export class TextareaComponent implements ControlValueAccessor {

  @Input() label = '';
  @Input() id = '';
  @Input() rows = 5;

  value = '';
  disabled = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(
    @Self() @Optional() public ngControl: NgControl,
    @Optional() private controlContainer: ControlContainer
  ){
    if (ngControl) ngControl.valueAccessor = this;
  }

  // ⭐ estado invalid real del form
  get invalid(): boolean {
    const c = this.ngControl?.control;
    const submitted = (this.controlContainer as any)?.submitted;
    return !!(c && c.invalid && (c.touched || c.dirty || submitted));
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

  onInput(event: Event) {
    const val = (event.target as HTMLTextAreaElement).value;
    this.value = val;
    this.onChange(val);
  }
}