import { Directive, ElementRef, Renderer2, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appLinkHoverUnderline]'
})
export class LinkHoverUnderlineDirective implements OnInit {
  @Input() underlineColor?: string;
  @Input() underlineHeight: string = '1px';
  @Input() underlineTransition: string = 'width 0.5s ease';
  @Input() dynamicColor?: string;

  private underline!: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.createUnderline();
  }

  private createUnderline() {
    this.underline = this.renderer.createElement('span');
    this.renderer.setStyle(this.underline, 'position', 'absolute');
    this.renderer.setStyle(this.underline, 'bottom', '0');
    this.renderer.setStyle(this.underline, 'left', '0');
    this.renderer.setStyle(this.underline, 'height', this.underlineHeight);
    this.renderer.setStyle(this.underline, 'width', '0');
    this.renderer.setStyle(this.underline, 'transition', this.underlineTransition);
    this.renderer.setStyle(this.underline, 'pointerEvents', 'none');

    const finalColor = this.dynamicColor ?? this.underlineColor ?? 'currentColor';
    this.renderer.setStyle(this.underline, 'backgroundColor', finalColor);

    const parent = this.el.nativeElement;
    this.renderer.setStyle(parent, 'position', 'relative');
    this.renderer.appendChild(parent, this.underline);
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.underline, 'width', '100%');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.underline, 'width', '0');
  }
}
