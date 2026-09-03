import { AfterViewInit, Directive, ElementRef, Renderer2, OnDestroy, Inject, PLATFORM_ID, Input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoaderService } from '../../../core/services/utils/loader.service';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Directive({
  selector: '[appFadeUpLetter]',
  standalone: true,
})
export class FadeUpLetterDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private animationSetup = false;
  private originalDimensions = { width: 0, height: 0 };
  private dimensionsCalculated = false;
  private isBrowser: boolean;

  @Input() manualTrigger: boolean = false;

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0px)');
      this.renderer.setStyle(this.el.nativeElement, 'visibility', 'visible');
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      return;
    }

    this.calculateAndReserveDimensions();
    
    if (this.manualTrigger) {
      return;
    }

    this.loaderService.currentLoader$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentLoader) => {
        if (currentLoader !== null) {
          this.resetAnimation();
        }
      });

    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled: boolean) => {
        if (enabled && !this.animationSetup) {
          setTimeout(() => {
            this.startAnimation();
          }, 80);
        } else if (!enabled) {
          this.resetAnimation();
        }
      });
  }

  public triggerAnimation(): void {
    this.startAnimation();
  }

  private calculateAndReserveDimensions(): void {
    if (this.dimensionsCalculated || !this.isBrowser) return;

    const nativeElement = this.el.nativeElement;
    const originalOpacity = nativeElement.style.opacity;
    const originalTransform = nativeElement.style.transform;
    this.renderer.setStyle(nativeElement, 'opacity', '1');
    this.renderer.setStyle(nativeElement, 'transform', 'none');
    nativeElement.offsetHeight;
    const rect = nativeElement.getBoundingClientRect();
    this.originalDimensions.width = rect.width;
    this.originalDimensions.height = rect.height;
    if (this.originalDimensions.height > 0) {
      this.renderer.setStyle(nativeElement, 'min-height', `${this.originalDimensions.height}px`);
    }
    
    this.renderer.setStyle(nativeElement, 'opacity', originalOpacity);
    this.renderer.setStyle(nativeElement, 'transform', originalTransform);
    
    this.dimensionsCalculated = true;
  }

  private resetAnimation(): void {
    if (!this.isBrowser) return;
    this.animationSetup = false;
    gsap.killTweensOf(this.el.nativeElement);
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0px)');
  }

  private startAnimation(): void {
    if (this.animationSetup || !this.isBrowser) return;
    this.animationSetup = true;

    requestAnimationFrame(() => {
      try {
        const nativeElement = this.el.nativeElement;
        
        if (!this.dimensionsCalculated || this.originalDimensions.height === 0) {
          this.calculateAndReserveDimensions();
        }

        const rect = nativeElement.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.88 && rect.bottom > 0;

        if (inView) {
          gsap.set(nativeElement, { opacity: 0, y: 20 });
          gsap.to(nativeElement, {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            duration: 0.6,
            delay: 0.05,
            onComplete: () => {
              this.renderer.setStyle(nativeElement, 'opacity', '1');
              this.renderer.setStyle(nativeElement, 'transform', 'none');
              this.renderer.removeStyle(nativeElement, 'will-change');
            }
          });
        } else {
          gsap.set(nativeElement, {
            opacity: 0,
            y: 25, 
            willChange: 'transform, opacity'
          });
          gsap.to(nativeElement, {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            duration: 0.6,
            delay: 0.05,
            scrollTrigger: {
              trigger: nativeElement,
              start: 'top 88%',
              once: true,
              toggleActions: 'play none none none',
            },
            onComplete: () => {
              this.renderer.setStyle(nativeElement, 'opacity', '1');
              this.renderer.setStyle(nativeElement, 'transform', 'none');
              this.renderer.removeStyle(nativeElement, 'will-change');
            }
          });
        }

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
    if (this.isBrowser) {
      gsap.killTweensOf(this.el.nativeElement);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}