import { Directive, ElementRef, HostListener, Inject, Input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Directive({
  selector: '[appPanimationcard]',
  standalone: true
})
export class PanimationcardDirective implements OnDestroy {
  private isBrowser: boolean;
  @Input() disableHover: boolean = false;
  private overlayEl?: HTMLElement | null;

  constructor(
    private el: ElementRef<HTMLElement>,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.overlayEl = this.el.nativeElement.querySelector('[data-overlay-image]');
      if (this.overlayEl) {
        gsap.set(this.overlayEl, { opacity: 0, willChange: 'opacity' });
      }
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.isBrowser || this.disableHover) return;
    if (!this.overlayEl) {
      this.overlayEl = this.el.nativeElement.querySelector('[data-overlay-image]');
      if (this.overlayEl) {
        gsap.set(this.overlayEl, { opacity: 0, willChange: 'opacity' });
      } else {
        return;
      }
    }
    gsap.to(this.overlayEl, {
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (!this.isBrowser || this.disableHover) return;
    if (!this.overlayEl) {
      this.overlayEl = this.el.nativeElement.querySelector('[data-overlay-image]');
      if (!this.overlayEl) return;
    }
    gsap.to(this.overlayEl, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    if (this.overlayEl) {
      gsap.killTweensOf(this.overlayEl);
      gsap.set(this.overlayEl, { willChange: 'auto', opacity: 0 });
    }
  }
}
