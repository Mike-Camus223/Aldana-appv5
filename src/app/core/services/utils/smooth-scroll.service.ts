import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

@Injectable({
  providedIn: 'root'
})
export class SmoothScrollService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
    }
  }

  init(wrapper: string = '#smooth-wrapper', content: string = '#smooth-content'): ScrollSmoother | null {
    if (!this.isBrowser) return null;

    ScrollSmoother.get()?.kill();

    const wrapperEl = document.querySelector(wrapper);
    const contentEl = document.querySelector(content);

    if (!wrapperEl || !contentEl) {
      return null;
    }

    try {
      const smoother = ScrollSmoother.create({
        wrapper: wrapper,
        content: content,
        smooth: 1.4,
        effects: true
      });
      return smoother;
    } catch (error) {
      console.warn('ScrollSmoother init error:', error);
      return null;
    }
  }

  destroy(): void {
    if (this.isBrowser) {
      ScrollSmoother.get()?.kill();
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
