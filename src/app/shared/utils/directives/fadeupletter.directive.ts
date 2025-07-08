import { AfterViewInit, Directive, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import gsap from 'gsap';
import { LoaderService } from '../../../core/services/utils/loader.service';

@Directive({
  selector: '[appFadeUpLetter]',
  standalone: true,
})
export class FadeUpLetterDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private loaderService: LoaderService
  ) {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(30px)');
  }

  ngAfterViewInit(): void {
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        if (enabled) {
          this.startAnimation();
        }
      });
  }

  private startAnimation(): void {
    gsap.to(this.el.nativeElement, {
      opacity: 1,
      y: 0,
      ease: 'power2.out',
      duration: 0.6,
      delay: 0.1,
      scrollTrigger: {
        trigger: this.el.nativeElement,
        start: 'top 95%',
        toggleActions: 'play none none none',
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}