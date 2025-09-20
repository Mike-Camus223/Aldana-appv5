import { Directive, ElementRef, OnInit, OnDestroy, Inject, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appFadeupall]'
})
export class FadeupallDirective implements OnInit, OnDestroy {
  @Input() animationIndex: number = 0;
  @Input() animationDelay: number = 0.15;

  private animationSubscription?: Subscription;
  private scrollTriggerInstance?: ScrollTrigger;
  private isInCarousel: boolean = false;
  private hasAnimated: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.detectCarouselContext();
      this.setupInitialState();
      this.animationSubscription = this.loaderService.animationsEnabled$.subscribe((enabled: boolean) => {
        if (enabled) {
          this.createScrollTriggerAnimation();
        }
      });
    }
  }

  private detectCarouselContext(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const keenSliderParent = this.elementRef.nativeElement.closest('.keen-slider');
    const keenSliderSlideParent = this.elementRef.nativeElement.closest('.keen-slider__slide');

    this.isInCarousel = !!(keenSliderParent || keenSliderSlideParent ||
      this.elementRef.nativeElement.classList.contains('keen-slider__slide'));
    
    if (this.isInCarousel && this.animationIndex === 0) {
      this.calculateAnimationIndex();
    }
  }

  private calculateAnimationIndex(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const parent = this.elementRef.nativeElement.closest('.keen-slider');
    if (parent) {
      const slides = Array.from(parent.querySelectorAll('.keen-slider__slide'));
      this.animationIndex = slides.indexOf(this.elementRef.nativeElement);
    }
  }

  private setupInitialState(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.isInCarousel) {
      gsap.set(this.elementRef.nativeElement, {
        opacity: 0,
        filter: 'blur(2px)', 
      });
    } else {
      gsap.set(this.elementRef.nativeElement, {
        opacity: 0,
        y: 40,
        z: 0
      });
    }
  }

  private createScrollTriggerAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.isInCarousel) {
      this.scrollTriggerInstance = ScrollTrigger.create({
        trigger: this.elementRef.nativeElement.closest('.keen-slider') || this.elementRef.nativeElement,
        start: 'top 90%',
        end: 'bottom 10%',
        toggleActions: 'play none none none',
        onEnter: () => {
          if (!this.hasAnimated) {
            this.hasAnimated = true;
            const delay = this.animationIndex * this.animationDelay;            
            gsap.to(this.elementRef.nativeElement, {
              opacity: 1,
              filter: 'blur(0px)',
              duration: 1,
              delay: delay,
              ease: 'power2.out'
            });
          }
        }
      });
    } else {
      this.scrollTriggerInstance = ScrollTrigger.create({
        trigger: this.elementRef.nativeElement,
        start: 'top 90%',
        end: 'bottom 10%',
        toggleActions: 'play none none none',
        onEnter: () => {
          if (!this.hasAnimated) {
            this.hasAnimated = true;
            gsap.to(this.elementRef.nativeElement, {
              opacity: 1,
              y: 0,
              z: 0,
              duration: 1,
              ease: 'power2.out'
            });
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.animationSubscription) {
        this.animationSubscription.unsubscribe();
      }
      if (this.scrollTriggerInstance) {
        this.scrollTriggerInstance.kill();
      }
    }
  }
}