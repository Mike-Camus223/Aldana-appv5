import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { filter } from 'rxjs/operators';
import { LoaderService } from './loader.service';

@Injectable({
  providedIn: 'root'
})
export class SmoothScrollService {
  private isBrowser: boolean;
  private currentSmoother: ScrollSmoother | null = null;
  private resizeObserver?: ResizeObserver;
  private initTimeoutRef: any = null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router,
    private loaderService: LoaderService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

      // 1. Cuando finaliza cualquier loader o se habilitan animaciones
      this.loaderService.animationsEnabled$.subscribe(enabled => {
        if (enabled) {
          this.ensureSmoother();
        }
      });

      // 2. En cada fin de navegación
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.ensureSmoother();
        });
    }
  }

  /**
   * Garantiza que ScrollSmoother esté activo, vinculado y actualizado con el DOM actual
   */
  ensureSmoother(wrapper: string = '#smooth-wrapper', content: string = '#smooth-content'): void {
    if (!this.isBrowser) return;

    if (this.initTimeoutRef) {
      clearTimeout(this.initTimeoutRef);
    }

    // Inicialización inmediata
    this.tryInit(wrapper, content);

    // Reintento tras renderizado del ciclo Angular
    this.initTimeoutRef = setTimeout(() => {
      this.tryInit(wrapper, content);
      this.refresh();
    }, 120);

    // Reintento tras transición completa de salida de loader
    setTimeout(() => {
      this.refresh();
    }, 350);
  }

  private tryInit(wrapper: string, content: string): ScrollSmoother | null {
    if (!this.isBrowser) return null;

    const wrapperEl = document.querySelector(wrapper);
    const contentEl = document.querySelector(content);

    if (!wrapperEl || !contentEl) {
      return null;
    }

    const existingSmoother = ScrollSmoother.get();
    
    // Si ya existe un smoother y el wrapper/content son los mismos elementos del DOM
    if (existingSmoother && existingSmoother.wrapper() === wrapperEl && existingSmoother.content() === contentEl) {
      existingSmoother.refresh();
      ScrollTrigger.refresh();
      this.observeContent(contentEl);
      return existingSmoother;
    }

    // Si cambió el DOM o el wrapper, matar la instancia previa y recrear
    if (existingSmoother) {
      existingSmoother.kill();
    }

    try {
      this.currentSmoother = ScrollSmoother.create({
        wrapper: wrapper,
        content: content,
        smooth: 1.4,
        effects: true
      });

      ScrollTrigger.refresh();
      this.observeContent(contentEl);
      return this.currentSmoother;
    } catch (error) {
      console.warn('ScrollSmoother init error:', error);
      return null;
    }
  }

  private observeContent(contentEl: Element): void {
    if (!this.isBrowser || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      this.refresh();
    });
    this.resizeObserver.observe(contentEl);
  }

  init(wrapper: string = '#smooth-wrapper', content: string = '#smooth-content'): ScrollSmoother | null {
    this.ensureSmoother(wrapper, content);
    return ScrollSmoother.get() || null;
  }

  destroy(): void {
    if (this.isBrowser) {
      this.resizeObserver?.disconnect();
      ScrollSmoother.get()?.kill();
      this.currentSmoother = null;
    }
  }

  refresh(): void {
    if (this.isBrowser) {
      ScrollSmoother.get()?.refresh();
      ScrollTrigger.refresh();
    }
  }

  scrollToTop(smooth: boolean = false): void {
    if (this.isBrowser) {
      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.scrollTo(0, smooth);
      } else {
        window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
      }
    }
  }
}
