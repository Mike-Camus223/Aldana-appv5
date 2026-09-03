import {
  Directive,
  ElementRef,
  AfterViewInit,
  Renderer2,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isPlatformBrowser } from '@angular/common';
import { LoaderService } from '../../../core/services/utils/loader.service';

// Registrar plugin solo en navegador
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Directive({
  selector: '[appZoomout]'
})
export class ZoomoutDirective implements AfterViewInit, OnDestroy {
  private animation: gsap.core.Tween | null = null;
  private scrollTrigger: ScrollTrigger | null = null;
  private destroy$ = new Subject<void>();
  private stylesInitialized = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
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
          }, 10);
        }
      });
  }

  private setupInitialStyles(element: HTMLElement): void {
  if (this.stylesInitialized) return;
  this.renderer.setStyle(element, 'transform', 'scale(1.5)');
  this.renderer.setStyle(element, 'filter', 'blur(4px)');
  this.renderer.setStyle(element, 'opacity', '0'); // Cambiar de 0.7 a 0
  this.renderer.setStyle(element, 'visibility', 'hidden'); // Añadir esta línea
  this.renderer.setStyle(element, 'will-change', 'transform, filter, opacity');
  this.stylesInitialized = true;
}

  private setupScrollTrigger(element: HTMLElement): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }
    this.scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: 'top 100%',
      once: true,
      markers: false,
      onEnter: () => this.startAnimation(element),
    });
  }

  
private startAnimation(element: HTMLElement): void {
  if (this.animation) {
    this.animation.kill();
    this.animation = null;
  }
  
  // Hacer visible inmediatamente antes de animar
  this.renderer.setStyle(element, 'visibility', 'visible');
  this.renderer.setStyle(element, 'opacity', '0.7'); // Partir desde 0.7
  
  this.animation = gsap.to(element, {
    scale: 1,
    filter: 'blur(0px)',
    opacity: 1,
    duration: 2.6,
    ease: 'power2.out',
    onComplete: () => {
      this.renderer.removeStyle(element, 'will-change');
      this.renderer.removeStyle(element, 'visibility'); // Limpiar también
    }
  });
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

  ngOnDestroy(): void {
    if (this.animation) this.animation.kill();
    if (this.scrollTrigger) this.scrollTrigger.kill();
    this.destroy$.next();
    this.destroy$.complete();
  }
}