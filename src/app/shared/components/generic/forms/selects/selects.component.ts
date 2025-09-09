import { Component, Input, Optional, Self, HostListener } from '@angular/core';
import { ControlValueAccessor, FormsModule, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-selects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './selects.component.html',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px) scaleY(0.95)' }),
        animate('200ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0) scaleY(1)' })
        )
      ]),
      transition(':leave', [
        animate('150ms ease-in',
          style({ opacity: 0, transform: 'translateY(-5px) scaleY(0.95)' })
        )
      ])
    ])
  ]
})
export class SelectsComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() id = '';
  @Input() options: any[] = [];
  @Input() optionLabel = 'label';
  @Input() optionValue = 'value';
  @Input() disabled = false;
  @Input() placeholder = '';

  value: any = null;
  isOpen = false;
  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(@Self() @Optional() public ngControl: NgControl) {
    if (ngControl) {
      ngControl.valueAccessor = this;
    }
  }

  get invalid(): boolean {
    return !!(this.ngControl?.control?.invalid && this.ngControl?.control?.dirty);
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.closeDropdown();
    }
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.onTouched();
    }
  }

  closeDropdown(): void {
    if (this.isOpen) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  selectOption(option: any): void {
    const newValue = option ? this.getOptionValue(option) : null;
    this.value = newValue;
    this.onChange(this.value);
    this.closeDropdown();
  }

  isSelected(option: any): boolean {
    if (!this.value) return false;
    const optionValue = this.getOptionValue(option);
    return optionValue === this.value;
  }

  getDisplayText(): string {
    if (!this.value) return '';
    
    if (typeof this.value === 'string' || typeof this.value === 'number') {
      const selectedOption = this.options.find(option => 
        this.getOptionValue(option) === this.value
      );
      return selectedOption ? this.getOptionLabel(selectedOption) : '';
    }
  
    if (this.value && typeof this.value === 'object') {
      return this.getOptionLabel(this.value);
    }
  
    return '';
  }
  

  getOptionLabel(option: any): string {
    if (typeof option === 'string' || typeof option === 'number') {
      return option.toString();
    }
    return option[this.optionLabel] || option.toString();
  }

  getOptionValue(option: any): any {
    if (typeof option === 'string' || typeof option === 'number') {
      return option;
    }
    // Cambiamos la lógica para devolver siempre el objeto completo si no es primitivo
    return option;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleDropdown();
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen) {
          this.isOpen = true;
        } else {
          this.navigateOptions(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen) {
          this.navigateOptions(-1);
        }
        break;
    }
  }

  private navigateOptions(direction: number): void {
    if (!this.options.length) return;

    const currentIndex = this.options.findIndex(option => 
      this.getOptionValue(option) === this.value
    );
    
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) {
      newIndex = this.options.length - 1;
    } else if (newIndex >= this.options.length) {
      newIndex = 0;
    }
    
    this.selectOption(this.options[newIndex]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // This is handled by the overlay div in template
  }
}