import { Directive, ElementRef, AfterViewInit, Renderer2, OnDestroy, Input, Inject, PLATFORM_ID } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoaderService } from '../../../core/services/utils/loader.service';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type RevealDirection = 'up' | 'down' | 'left' | 'right';

@Directive({
  selector: '[appCardInitAnimation]'
})
export class CardInitAnimationDirective implements AfterViewInit, OnDestroy {

  @Input('appCardInitAnimation') direction: RevealDirection = 'up';

  private animation: gsap.core.Timeline | null = null;
  private scrollTrigger: ScrollTrigger | null = null;
  private destroy$ = new Subject<void>();
  private stylesInitialized = false;
  @Input() wave: boolean = false;
  @Input() animationDelay: number = 0;
  @Input() gray: boolean = false;

  constructor(private el: ElementRef, private renderer: Renderer2, private loaderService: LoaderService) { }

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;
    if (!element) return;
    this.setupInitialStyles(element);

    // Reset al iniciar cualquier loader
    this.loaderService.currentLoader$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loader) => {
        if (loader) {
          this.resetAnimation();
        }
      });

    // Re-configurar cuando las animaciones estén habilitadas (post-loader)
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        if (enabled) {
          // Pequeño delay para asegurar layout estable
          setTimeout(() => {
            this.setupScrollTrigger(element);
          }, 50);
        }
      });
  }

  private setupInitialStyles(element: HTMLElement): void {
    if (this.stylesInitialized) return;
    this.renderer.setStyle(element, 'transform', 'scale(1.5)');
    //     this.renderer.setStyle(
    //   element,
    //   'filter',
    //   this.gray ? 'blur(4px) grayscale(100%)' : 'blur(4px)'
    // );

    this.renderer.setStyle(element, 'opacity', '0.7');
    this.renderer.setStyle(element, 'will-change', 'transform, filter, opacity, clip-path');

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
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }

    if (this.wave) {
      this.renderer.setAttribute(element, 'data-wave', 'true');

      // Permitir que el layout se asiente antes de medir coordenadas
      setTimeout(() => {
        const siblings = Array.from(document.querySelectorAll('[data-wave="true"]'))
          .filter(el => {
            const rect = el.getBoundingClientRect();
            const thisRect = element.getBoundingClientRect();
            // Pertenecen a la misma fila si están a menos de 150px de diferencia vertical
            return Math.abs(rect.top - thisRect.top) < 150;
          }) as HTMLElement[];

        siblings.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        const index = siblings.indexOf(element);
        if (index !== -1) {
          this.animationDelay = index * 0.2; // Stagger de 200ms
        }

        this.createScrollTrigger(element);
      }, 60);
    } else {
      this.createScrollTrigger(element);
    }
  }

  private createScrollTrigger(element: HTMLElement): void {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top 85%",
      once: true,
      markers: false,
      onEnter: () => {
        this.startAnimation(element);
      }
    });
  }

  private startAnimation(element: HTMLElement): void {
    if (this.animation) {
      this.animation.kill();
      this.animation = null;
    }
    this.animation = gsap.timeline();
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
      duration: 2.5,
      ease: 'power2.out',
      delay: this.animationDelay,
    }, 0);
    this.animation!.to(element, {
      scale: 1,
      // filter: this.gray ? 'blur(0px) grayscale(100%)' : 'blur(0px)',

      opacity: 1,
      duration: 2.6,
      ease: 'power2.out',
      delay: this.animationDelay,
      onComplete: () => {
        this.cleanupStyles(element);
      }
    }, 0);
  }

  private animateDown(element: HTMLElement): void {
    this.animation!.to(element, {
      clipPath: 'inset(0% 0 0% 0)',
      duration: 2.5,
      ease: 'power2.out'
    }, 0);
    this.animation!.to(element, {
      scale: 1.2,
      // filter: this.gray ? 'blur(0px) grayscale(100%)' : 'blur(0px)',

      opacity: 1,
      duration: 2.6,
      ease: 'power2.out',
      onComplete: () => {
        this.cleanupStyles(element);
      }
    }, 0);
  }

  private animateLeft(element: HTMLElement): void {
    this.animation!.to(element, {
      clipPath: 'inset(0% 0% 0 0)',
      duration: 2.5,
      ease: 'power2.out'
    }, 0);
    this.animation!.to(element, {
      scale: 1,
      // filter: this.gray ? 'blur(0px) grayscale(100%)' : 'blur(0px)',

      opacity: 1,
      duration: 2.6,
      ease: 'power2.out',
      onComplete: () => {
        this.cleanupStyles(element);
      }
    }, 0);
  }

  private animateRight(element: HTMLElement): void {
    this.animation!.to(element, {
      clipPath: 'inset(0% 0 0% 0%)',
      duration: 2.5,
      ease: 'power2.out'
    }, 0);
    this.animation!.to(element, {
      scale: 1,
      // filter: this.gray ? 'blur(0px) grayscale(100%)' : 'blur(0px)',

      opacity: 1,
      duration: 2.6,
      ease: 'power2.out',
      onComplete: () => {
        this.cleanupStyles(element);
      }
    }, 0);
  }

  private cleanupStyles(element: HTMLElement): void {
    this.renderer.removeStyle(element, 'will-change');
    this.renderer.removeStyle(element, 'clip-path');
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