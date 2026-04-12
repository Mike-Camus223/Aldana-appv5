import { Directive, ElementRef, Renderer2, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appLinkHoverUnderline]',
  standalone: true
})
export class LinkHoverUnderlineDirective implements OnInit {
  @Input() underlineColor?: string;
  @Input() underlineHeight: string = '1px';
  @Input() underlineTransition: string = 'width 0.5s ease';
  @Input() dynamicColor?: string;
  @Input() defaultColor?: string; // Color cuando no hay hover
  @Input() hoverColor?: string;   // Color cuando hay hover
  @Input() paddingTop?: string;
 

  private underline!: HTMLElement;
  private baseColor!: string;

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
    this.renderer.setStyle(this.underline, 'zIndex', '2');

    // Color base: primero defaultColor, luego underlineColor, luego currentColor
    this.baseColor = this.defaultColor ?? this.underlineColor ?? 'currentColor';
    this.renderer.setStyle(this.underline, 'backgroundColor', this.baseColor);
    this.renderer.setStyle(this.underline, 'padding-top', this.paddingTop ?? '0');

    const parent = this.el.nativeElement;
    this.renderer.setStyle(parent, 'position', 'relative');
    this.renderer.appendChild(parent, this.underline);
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.underline, 'width', '100%');
    const hover = this.hoverColor ?? this.dynamicColor ?? this.baseColor;
    this.renderer.setStyle(this.underline, 'backgroundColor', hover);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.underline, 'width', '0');
    this.renderer.setStyle(this.underline, 'backgroundColor', this.baseColor);
  }
}
