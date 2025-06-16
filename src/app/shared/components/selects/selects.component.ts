import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Select } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-selects',
  standalone: true,
  imports: [CommonModule, Select, FloatLabelModule,FormsModule],
  templateUrl: './selects.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectsComponent),
    multi: true
  }]
})
export class SelectsComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() id = '';
  @Input() options: any[] = [];
  @Input() optionLabel = 'label';

  value: any = null;
  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onValueChange(value: any) {
    this.value = value;
    this.onChange(value);
  }
}
