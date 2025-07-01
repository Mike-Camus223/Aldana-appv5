import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appDebounceClick]'
})
export class DebounceClickDirective {
  @Input() debounceTime = 500; 
  @Output() debounceClick = new EventEmitter();

  private canClick = true;

  @HostListener('click', ['$event'])
  clickEvent(event: Event) {
    if (this.canClick) {
      this.canClick = false;
      this.debounceClick.emit(event);

      setTimeout(() => {
        this.canClick = true;
      }, this.debounceTime);
    } else {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
