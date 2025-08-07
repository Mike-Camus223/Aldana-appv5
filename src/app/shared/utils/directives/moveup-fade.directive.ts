import { Directive, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { gsap } from 'gsap';

@Directive({
  selector: '[appMoveupFade]'
})
export class MoveupFadeDirective implements AfterViewInit {
  private parent?: HTMLElement;
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  ngAfterViewInit(): void {
    this.parent = this.el.nativeElement.closest('.group');
    if (!this.parent) return;
    gsap.set(this.el.nativeElement, {
      y: 300,
      opacity: 0
    });
    this.renderer.listen(this.parent, 'mouseenter', () => {
      gsap.to(this.el.nativeElement, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: 'power2.out'
      });
    });
    this.renderer.listen(this.parent, 'mouseleave', () => {
      gsap.to(this.el.nativeElement, {
        y: 300,
        opacity: 0,
        duration: 0.8,
        ease: 'power1.inOut'
      });
    });
  }
}
