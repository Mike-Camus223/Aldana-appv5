import { Directive, ElementRef, AfterViewInit, Renderer2, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isPlatformBrowser } from '@angular/common';

// Solo registrar plugins en el navegador
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Directive({
  selector: '[appZoomout]'
})
export class ZoomoutDirective implements AfterViewInit, OnDestroy {
  private animation: gsap.core.Tween | null = null;
  private scrollTrigger: ScrollTrigger | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const element = this.el.nativeElement;

    if (!element) return;

    // Configurar estilos iniciales
    this.setupInitialStyles(element);
    
    // Configurar ScrollTrigger después de un pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.setupScrollTrigger(element);
    }, 100);
  }

  private setupInitialStyles(element: HTMLElement): void {
    this.renderer.setStyle(element, 'transform', 'scale(1.3)');
    this.renderer.setStyle(element, 'filter', 'blur(8px)');
    this.renderer.setStyle(element, 'opacity', '0.7');
    this.renderer.setStyle(element, 'will-change', 'transform, filter, opacity');
  }

  private setupScrollTrigger(element: HTMLElement): void {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top 85%", // Comienza cuando el elemento está al 85% del viewport
      once: true,       // Solo se ejecuta una vez
      markers: false,   // Cambia a true para debugging
      onEnter: () => {
        this.startAnimation(element);
      }
    });
  }

  private startAnimation(element: HTMLElement): void {
    this.animation = gsap.to(element, {
      scale: 1,
      filter: 'blur(0px)',
      opacity: 1,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => {
        // Limpiar will-change después de la animación
        this.renderer.removeStyle(element, 'will-change');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.animation) {
      this.animation.kill();
    }
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }
}