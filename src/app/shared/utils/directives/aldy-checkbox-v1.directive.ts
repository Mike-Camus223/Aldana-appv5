import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[AldyCheckboxV1]'
})
export class AldyCheckboxV1Directive {
  private checkmarkIcon: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.setBaseStyles();
    if ((this.el.nativeElement as HTMLInputElement).checked) {
      this.applyCheckedStyles();
    }
  }

  private setBaseStyles(): void {
    const checkbox = this.el.nativeElement;
    this.renderer.setStyle(checkbox, 'border-radius', '2px');
    this.renderer.setStyle(checkbox, '-webkit-appearance', 'none');
    this.renderer.setStyle(checkbox, 'appearance', 'none');
    this.renderer.setStyle(checkbox, 'background-color', '#fff');
    this.renderer.setStyle(checkbox, 'border', '1px solid #646464');
    this.renderer.setStyle(checkbox, 'cursor', 'pointer');
    this.renderer.setStyle(checkbox, 'display', 'flex');
    this.renderer.setStyle(checkbox, 'align-items', 'center');
    this.renderer.setStyle(checkbox, 'justify-content', 'center');
    this.renderer.setStyle(checkbox, 'position', 'relative');
    this.renderer.setStyle(checkbox, 'transition', 'box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out');
    this.renderer.setStyle(checkbox, 'width', '12px');
    this.renderer.setStyle(checkbox, 'height', '12px');
    this.renderer.setStyle(checkbox, 'font-size', '12px'); 
    this.renderer.setStyle(checkbox, 'color', '#ffffff');  
  }

  @HostListener('change')
  onChange() {
    const checkbox = this.el.nativeElement as HTMLInputElement;
    if (checkbox.checked) {
      this.applyCheckedStyles();
    } else {
      this.removeCheckedStyles();
    }
  }

  private applyCheckedStyles(): void {
    const checkbox = this.el.nativeElement;
    this.renderer.setStyle(checkbox, 'background-color', 'var(--color-aldy-primary-600)');
    this.renderer.setStyle(checkbox, 'box-shadow', '0 0 0 2px var(--color-aldy-primary-600)');
    this.renderer.setStyle(checkbox, 'border', '2px solid #ffffff');

    if (!this.checkmarkIcon) {
      this.checkmarkIcon = this.renderer.createElement('i');
      this.renderer.addClass(this.checkmarkIcon, 'fa-solid');
      this.renderer.addClass(this.checkmarkIcon, 'fa-check');
      this.renderer.appendChild(checkbox, this.checkmarkIcon);
    }
  }

  private removeCheckedStyles(): void {
    const checkbox = this.el.nativeElement;
    this.renderer.setStyle(checkbox, 'background-color', '#fff');
    this.renderer.setStyle(checkbox, 'box-shadow', 'none');
    this.renderer.setStyle(checkbox, 'border', '1px solid #646464');

    if (this.checkmarkIcon) {
      this.renderer.removeChild(checkbox, this.checkmarkIcon);
      this.checkmarkIcon = null;
    }
  }
}
