import { Directive, ElementRef, Renderer2, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appAldyRadio]'
})
export class AldyRadioDirective {
  private checkmarkIcon: HTMLElement | null = null;

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.setBaseStyles();
    if ((this.el.nativeElement as HTMLInputElement).checked) {
      this.applyCheckedStyles();
    }
  }

  private setBaseStyles(): void {
    const radio = this.el.nativeElement;
    this.renderer.setStyle(radio, 'border-radius', '2px'); // Cuadrado como checkbox
    this.renderer.setStyle(radio, '-webkit-appearance', 'none');
    this.renderer.setStyle(radio, 'appearance', 'none');
    this.renderer.setStyle(radio, 'background-color', '#fff');
    this.renderer.setStyle(radio, 'border', '1px solid #646464');
    this.renderer.setStyle(radio, 'cursor', 'pointer');
    this.renderer.setStyle(radio, 'display', 'flex');
    this.renderer.setStyle(radio, 'align-items', 'center');
    this.renderer.setStyle(radio, 'justify-content', 'center');
    this.renderer.setStyle(radio, 'position', 'relative');
    this.renderer.setStyle(radio, 'transition', 'box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out');
    this.renderer.setStyle(radio, 'width', '12px');
    this.renderer.setStyle(radio, 'height', '12px');
    this.renderer.setStyle(radio, 'font-size', '12px');
    this.renderer.setStyle(radio, 'color', '#ffffff');
  }

  @HostListener('change')
  onChange() {
    const radio = this.el.nativeElement as HTMLInputElement;
    const radios = document.querySelectorAll(`input[type="radio"][name="${radio.name}"]`);
    radios.forEach((r: any) => {
      if (r !== radio && r.hasAttribute('appAldyRadio')) {
        const event = new CustomEvent('aldyRadioUncheck', { bubbles: true });
        r.dispatchEvent(event);
      }
    });

    if (radio.checked) {
      this.applyCheckedStyles();
    }
  }

  @HostListener('aldyRadioUncheck')
  onUncheck() {
    this.removeCheckedStyles();
  }

  private applyCheckedStyles(): void {
    const radio = this.el.nativeElement;
    this.renderer.setStyle(radio, 'background-color', 'var(--color-aldy-primary-600)');
    this.renderer.setStyle(radio, 'box-shadow', '0 0 0 2px var(--color-aldy-primary-600)');
    this.renderer.setStyle(radio, 'border', '2px solid #ffffff');

    if (!this.checkmarkIcon) {
      this.checkmarkIcon = this.renderer.createElement('i');
      this.renderer.addClass(this.checkmarkIcon, 'fa-solid');
      this.renderer.addClass(this.checkmarkIcon, 'fa-check');
      this.renderer.appendChild(radio, this.checkmarkIcon);
    }
  }

  private removeCheckedStyles(): void {
    const radio = this.el.nativeElement;
    this.renderer.setStyle(radio, 'background-color', '#fff');
    this.renderer.setStyle(radio, 'box-shadow', 'none');
    this.renderer.setStyle(radio, 'border', '1px solid #646464');

    if (this.checkmarkIcon) {
      this.renderer.removeChild(radio, this.checkmarkIcon);
      this.checkmarkIcon = null;
    }
  }
}
