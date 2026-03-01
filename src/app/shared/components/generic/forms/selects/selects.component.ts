import {
  Component,
  Input,
  Optional,
  Self,
  HostListener
} from '@angular/core';

import {
  ControlValueAccessor,
  FormsModule,
  NgControl,
  ControlContainer
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

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

  value: any = null;
  isOpen = false;

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(
    @Self() @Optional() public ngControl: NgControl,
    @Optional() private controlContainer: ControlContainer
  ) {
    if (ngControl) ngControl.valueAccessor = this;
  }

  // ⭐ VALID STATE PROFESIONAL
  get invalid(): boolean {
    const c = this.ngControl?.control;
    const submitted = (this.controlContainer as any)?.submitted;
    return !!(c && c.invalid && (c.touched || c.dirty || submitted));
  }

  // ---------- CVA ----------
  writeValue(value: any){ this.value = value; }
  registerOnChange(fn:any){ this.onChange = fn; }
  registerOnTouched(fn:any){ this.onTouched = fn; }

  setDisabledState(disabled:boolean){
    this.disabled = disabled;
    if(disabled) this.closeDropdown();
  }

  // ---------- UI ----------
  toggleDropdown(){
    if(this.disabled) return;
    this.isOpen = !this.isOpen;
    if(!this.isOpen) this.onTouched();
  }

  closeDropdown(){
    if(this.isOpen){
      this.isOpen=false;
      this.onTouched();
    }
  }

  selectOption(option:any){
    this.value = this.getOptionValue(option);
    this.onChange(this.value);
    this.closeDropdown();
  }

  isSelected(option:any){
    return this.getOptionValue(option) === this.value;
  }

  // ---------- HELPERS ----------
  getDisplayText(){
    const found = this.options.find(o =>
      this.getOptionValue(o) === this.value
    );
    return found ? this.getOptionLabel(found) : '';
  }

  getOptionLabel(option:any){
    if(typeof option === 'string' || typeof option === 'number')
      return option.toString();

    return option[this.optionLabel] ?? option.toString();
  }

  getOptionValue(option:any){
    if(typeof option === 'string' || typeof option === 'number')
      return option;

    return option[this.optionValue] ?? option;
  }

  // ---------- KEYBOARD ----------
  onKeyDown(event:KeyboardEvent){
    if(this.disabled) return;

    switch(event.key){

      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleDropdown();
        break;

      case 'Escape':
        this.closeDropdown();
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.navigate(1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.navigate(-1);
        break;
    }
  }

  private navigate(dir:number){
    if(!this.options.length) return;

    const i = this.options.findIndex(o =>
      this.getOptionValue(o) === this.value
    );

    let next = i + dir;

    if(next < 0) next = this.options.length-1;
    if(next >= this.options.length) next = 0;

    this.selectOption(this.options[next]);
  }

  // ---------- CLICK OUTSIDE ----------
  @HostListener('document:click', ['$event'])
  onDocClick(e:Event){
    const target = e.target as HTMLElement;
    if(!target.closest(`#${this.id}`))
      this.closeDropdown();
  }
}