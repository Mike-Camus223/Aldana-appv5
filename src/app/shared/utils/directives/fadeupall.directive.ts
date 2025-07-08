import { Directive, ElementRef, OnInit, OnDestroy, Inject } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appFadeupall]'
})
export class FadeupallDirective implements OnInit, OnDestroy {
  private animationSubscription?: Subscription;
  private scrollTriggerInstance?: ScrollTrigger;
  private isInCarousel: boolean = false;
  private hasAnimated: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.detectCarouselContext();
    this.setupInitialState();
    this.animationSubscription = this.loaderService.animationsEnabled$.subscribe(enabled => {
      if (enabled) {
        this.createScrollTriggerAnimation();
      }
    });
  }

  private detectCarouselContext(): void {
    const keenSliderParent = this.elementRef.nativeElement.closest('.keen-slider');
    const keenSliderSlideParent = this.elementRef.nativeElement.closest('.keen-slider__slide');

    this.isInCarousel = !!(keenSliderParent || keenSliderSlideParent ||
      this.elementRef.nativeElement.classList.contains('keen-slider__slide'));
  }

  private setupInitialState(): void {
    if (this.isInCarousel) {
      gsap.set(this.elementRef.nativeElement, {
        opacity: 0
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
    if (this.isInCarousel) {
      this.scrollTriggerInstance = ScrollTrigger.create({
        trigger: this.elementRef.nativeElement.closest('.keen-slider') || this.elementRef.nativeElement,
        start: 'top 90%',
        end: 'bottom 10%',
        toggleActions: 'play none none none',
        onEnter: () => {
          if (!this.hasAnimated) {
            this.hasAnimated = true;
            gsap.to(this.elementRef.nativeElement, {
              opacity: 1,
              duration: 1,
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
    if (this.animationSubscription) {
      this.animationSubscription.unsubscribe();
    }
    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
    }
  }
}