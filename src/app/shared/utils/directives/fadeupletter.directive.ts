import { AfterViewInit, Directive, ElementRef, Renderer2, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import gsap from 'gsap';
import { LoaderService } from '../../../core/services/utils/loader.service';

@Directive({
  selector: '[appFadeUpLetter]',
  standalone: true,
})
export class FadeUpLetterDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private animationSetup = false;
  private originalDimensions = { width: 0, height: 0 };
  private dimensionsCalculated = false;

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0px)');
      this.renderer.setStyle(this.el.nativeElement, 'visibility', 'visible');
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.calculateAndReserveDimensions();
      
      this.loaderService.animationsEnabled$
        .pipe(takeUntil(this.destroy$))
        .subscribe((enabled: boolean) => {
          if (enabled && !this.animationSetup) {
            setTimeout(() => {
              this.startAnimation();
            }, 50);
          } else if (!enabled) {
            this.resetAnimation();
          }
        });
    }
  }

  private calculateAndReserveDimensions(): void {
    if (this.dimensionsCalculated || !isPlatformBrowser(this.platformId)) return;

    const nativeElement = this.el.nativeElement;
    const originalOpacity = nativeElement.style.opacity;
    const originalTransform = nativeElement.style.transform;
    this.renderer.setStyle(nativeElement, 'opacity', '1');
    this.renderer.setStyle(nativeElement, 'transform', 'none');
    nativeElement.offsetHeight;
    const rect = nativeElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(nativeElement);
    this.originalDimensions.width = rect.width;
    this.originalDimensions.height = rect.height;
    if (this.originalDimensions.height > 0) {
      this.renderer.setStyle(nativeElement, 'min-height', `${this.originalDimensions.height}px`);
    }
    
    if (this.originalDimensions.width > 0 && computedStyle.width !== 'auto') {
      this.renderer.setStyle(nativeElement, 'min-width', `${this.originalDimensions.width}px`);
    }
    
    this.renderer.setStyle(nativeElement, 'opacity', originalOpacity);
    this.renderer.setStyle(nativeElement, 'transform', originalTransform);
    
    this.dimensionsCalculated = true;
  }

  private resetAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.animationSetup = false;
    gsap.killTweensOf(this.el.nativeElement);
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0px)');
  }

  private startAnimation(): void {
    if (this.animationSetup || !isPlatformBrowser(this.platformId)) return;
    this.animationSetup = true;

    requestAnimationFrame(() => {
      try {
        const nativeElement = this.el.nativeElement;
        
        if (!this.dimensionsCalculated) {
          this.calculateAndReserveDimensions();
        }

        gsap.set(nativeElement, {
          opacity: 0,
          y: 30, 
          willChange: 'transform, opacity'
        });
        gsap.to(nativeElement, {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          duration: 0.6,
          delay: 0.1,
          scrollTrigger: {
            trigger: nativeElement,
            start: 'top 100%',
            toggleActions: 'play none none none',
          },
          onComplete: () => {
            nativeElement.style.willChange = 'auto';
          }
        });
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }

      } catch (error) {
        this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
        this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0px)');
      }
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      gsap.killTweensOf(this.el.nativeElement);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}