import { Directive, ElementRef, AfterViewInit, Renderer2, OnDestroy, Input, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoaderService } from '../../../core/services/utils/loader.service';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type RevealDirection = 'up' | 'down' | 'left' | 'right';

@Directive({
  selector: '[appCardInitAnimation]',
  standalone: true
})
export class CardInitAnimationDirective implements AfterViewInit, OnDestroy {

  @Input('appCardInitAnimation') direction: RevealDirection = 'up';
  @Input() waveinit: boolean = true;
  @Input() animationDelay: number = 0;
  @Input() gray: boolean = false;

  private animation: gsap.core.Timeline | null = null;
  private scrollTrigger: ScrollTrigger | null = null;
  private destroy$ = new Subject<void>();
  private stylesInitialized = false;
  private hasAnimated = false;
  private isBrowser: boolean;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;
    if (!element) return;

    if (!this.isBrowser) {
      this.renderer.removeStyle(element, 'clip-path');
      this.renderer.setStyle(element, 'opacity', '1');
      return;
    }

    this.setupInitialStyles(element);

    // Reset styles on any loader start
    this.loaderService.currentLoader$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loader) => {
        if (loader) {
          this.resetAnimation();
        }
      });

    // ONLY configure and trigger animations when loader has completely finished
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        if (enabled && !this.hasAnimated) {
          setTimeout(() => {
            this.setupScrollTrigger(element);
          }, 80);
        }
      });
  }

  private setupInitialStyles(element: HTMLElement): void {
    if (this.stylesInitialized || this.hasAnimated) return;
    this.renderer.setStyle(element, 'transform', 'scale(1.1)');
    this.renderer.setStyle(element, 'opacity', '0.7');
    this.renderer.setStyle(element, 'will-change', 'transform, opacity, clip-path');

    if (this.direction === 'up') {
      this.renderer.setStyle(element, 'clip-path', 'inset(100% 0 0 0)');
    } else if (this.direction === 'down') {
      this.renderer.setStyle(element, 'clip-path', 'inset(0 0 100% 0)');
    } else if (this.direction === 'left') {
      this.renderer.setStyle(element, 'clip-path', 'inset(0 100% 0 0)');
    } else if (this.direction === 'right') {
      this.renderer.setStyle(element, 'clip-path', 'inset(0 0 0 100%)');
    }
    this.stylesInitialized = true;
  }

  private setupScrollTrigger(element: HTMLElement): void {
    if (this.hasAnimated || !this.isBrowser) return;

    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }

    if (this.waveinit) {
      this.renderer.setAttribute(element, 'data-wave', 'true');

      setTimeout(() => {
        if (this.hasAnimated) return;
        
        // Find siblings on the same horizontal row (top within 150px)
        const siblings = Array.from(document.querySelectorAll('[data-wave="true"]'))
          .filter(el => {
            const r = el.getBoundingClientRect();
            const thisRect = element.getBoundingClientRect();
            return Math.abs(r.top - thisRect.top) < 150;
          }) as HTMLElement[];

        siblings.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        const index = siblings.indexOf(element);
        if (index !== -1) {
          this.animationDelay = index * 0.15;
        }

        // Now check if it's already in viewport or should scroll trigger
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
          this.startAnimation(element);
        } else {
          this.createScrollTrigger(element);
        }
      }, 60);
    } else {
      // No wave: check immediately
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) {
        this.startAnimation(element);
      } else {
        this.createScrollTrigger(element);
      }
    }
  }

  private createScrollTrigger(element: HTMLElement): void {
    if (this.hasAnimated || !this.isBrowser) return;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top 88%",
      once: true,
      markers: false,
      onEnter: () => {
        this.startAnimation(element);
      }
    });

    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  private startAnimation(element: HTMLElement): void {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }

    if (this.animation) {
      this.animation.kill();
      this.animation = null;
    }

    this.animation = gsap.timeline({
      onComplete: () => {
        this.cleanupStyles(element);
      }
    });

    if (this.direction === 'up') {
      this.animateUp(element);
    } else if (this.direction === 'down') {
      this.animateDown(element);
    } else if (this.direction === 'left') {
      this.animateLeft(element);
    } else if (this.direction === 'right') {
      this.animateRight(element);
    }
  }

  private resetAnimation(): void {
    const element: HTMLElement = this.el.nativeElement;
    this.hasAnimated = false;
    if (this.animation) {
      this.animation.kill();
      this.animation = null;
    }
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }
    this.stylesInitialized = false;
    this.setupInitialStyles(element);
  }

  private animateUp(element: HTMLElement): void {
    this.animation!.to(element, {
      clipPath: 'inset(0% 0 0 0)',
      duration: 1.3,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
    this.animation!.to(element, {
      scale: 1,
      opacity: 1,
      duration: 1.4,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
  }

  private animateDown(element: HTMLElement): void {
    this.animation!.to(element, {
      clipPath: 'inset(0% 0 0% 0)',
      duration: 1.3,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
    this.animation!.to(element, {
      scale: 1,
      opacity: 1,
      duration: 1.4,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
  }

  private animateLeft(element: HTMLElement): void {
    this.animation!.to(element, {
      clipPath: 'inset(0% 0% 0 0)',
      duration: 1.3,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
    this.animation!.to(element, {
      scale: 1,
      opacity: 1,
      duration: 1.4,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
  }

  private animateRight(element: HTMLElement): void {
    this.animation!.to(element, {
      clipPath: 'inset(0% 0 0% 0%)',
      duration: 1.3,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
    this.animation!.to(element, {
      scale: 1,
      opacity: 1,
      duration: 1.4,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
  }

  private cleanupStyles(element: HTMLElement): void {
    this.renderer.removeAttribute(element, 'data-wave');
    this.renderer.removeStyle(element, 'will-change');
    this.renderer.removeStyle(element, 'clip-path');
    this.renderer.setStyle(element, 'opacity', '1');
    this.renderer.setStyle(element, 'transform', 'none');
  }

  ngOnDestroy(): void {
    if (this.animation) {
      this.animation.kill();
    }
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}