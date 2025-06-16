import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({ 
  selector: '[appButtonPrimary]' 
})
export class ButtonPrimaryDirective {

  constructor(private el: ElementRef, private renderer: Renderer2) { 
    this.applyStyles();
  }
  
  private applyStyles(): void {
    this.renderer.addClass(this.el.nativeElement, 'bg-aldy-primary-400');
    this.renderer.addClass(this.el.nativeElement, 'hover:bg-aldy-primary-500');
    this.renderer.addClass(this.el.nativeElement, 'transition-all');
    this.renderer.addClass(this.el.nativeElement, 'ease-in-out');
    this.renderer.addClass(this.el.nativeElement, 'duration-300');
    this.renderer.addClass(this.el.nativeElement, 'text-white');
    this.renderer.addClass(this.el.nativeElement, 'rounded-sm');
  }
}
