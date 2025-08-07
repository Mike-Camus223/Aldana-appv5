import { Directive, ElementRef, AfterViewInit } from '@angular/core';
import { gsap } from 'gsap';

@Directive({
  selector: '[appFade]'
})
export class FadeDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}
  ngAfterViewInit(): void {
    gsap.from(this.el.nativeElement, {
      opacity: 0,
      duration: 1,
      ease: 'power2.out'
    });
  }
}
