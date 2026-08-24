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
  selector: '[appWordReveal]',
  standalone: true,
})
export class WordRevealDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private originalContent: string = '';
  private animationSetup = false;
  private animationTween: gsap.core.Tween | null = null;
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
    }
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      return;
    }
    
    this.originalContent = this.el.nativeElement.innerHTML || this.el.nativeElement.textContent || '';
    
    if (this.manualTrigger) {
      return;
    }

    // Reset on loader
    this.loaderService.currentLoader$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentLoader) => {
        if (currentLoader !== null) {
          this.resetAnimation();
        }
      });

    // ONLY setup animation when loader has completed
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        if (enabled && !this.animationSetup) {
          setTimeout(() => {
            this.setupAnimation();
          }, 80);
        }
      });
  }

  public triggerAnimation(): void {
    this.setupAnimation();
  }

  private resetAnimation(): void {
    this.animationSetup = false;
    if (this.animationTween) {
      this.animationTween.kill();
      this.animationTween = null;
    }
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
  }

  private setupAnimation(): void {
    if (this.animationSetup || !this.isBrowser) return;
    this.animationSetup = true;

    requestAnimationFrame(() => {
      try {
        const nativeElement = this.el.nativeElement;
        
        if (!nativeElement || !this.originalContent.trim()) {
          this.renderer.setStyle(nativeElement, 'opacity', '1');
          return;
        }
        
        this.setupAnimationWithHTML();

      } catch (error) {
        console.error('Error setting up word reveal animation:', error);
        this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      }
    });
  }

  private createWordRevealAnimation(element: HTMLElement): void {
    const allWordSpans = element.querySelectorAll('.word-reveal-animated');

    if (allWordSpans.length > 0) {
      this.renderer.setStyle(element, 'opacity', '1');

      const rect = element.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.88 && rect.bottom > 0;

      if (inView) {
        this.animationTween = gsap.to(allWordSpans, {
          y: 0,
          ease: 'cubic-bezier(0.77, 0, 0.175, 1)',
          duration: 0.7,
          stagger: 0.05,
          delay: 0.05,
          onComplete: () => {
            allWordSpans.forEach((span: any) => {
              span.style.willChange = 'auto';
            });
          }
        });
      } else {
        this.animationTween = gsap.to(allWordSpans, {
          y: 0,
          ease: 'cubic-bezier(0.77, 0, 0.175, 1)',
          duration: 0.7,
          stagger: 0.05,
          delay: 0.05,
          scrollTrigger: {
            trigger: element,
            start: 'top 88%',
            once: true,
            toggleActions: 'play none none none',
          },
          onComplete: () => {
            allWordSpans.forEach((span: any) => {
              span.style.willChange = 'auto';
            });
          }
        });
      }
    } else {
      this.renderer.setStyle(element, 'opacity', '1');
    }
  }

  private setupAnimationWithHTML(): void {
    const nativeElement = this.el.nativeElement;
    const wrapper = this.renderer.createElement('div');
    
    this.renderer.setStyle(wrapper, 'display', 'block');
    this.renderer.setStyle(wrapper, 'overflow', 'hidden');
    this.renderer.setStyle(wrapper, 'width', '100%');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.originalContent;
    
    this.processNode(tempDiv, wrapper);

    nativeElement.innerHTML = '';
    this.renderer.appendChild(nativeElement, wrapper);
    this.createWordRevealAnimation(nativeElement);
  }

  private processNode(node: Node, parent: HTMLElement): void {
    const segments: Array<{type: 'text' | 'element', content: string | HTMLElement}> = [];
    
    node.childNodes.forEach((child: Node) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || '';
        segments.push({type: 'text', content: text});
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        segments.push({type: 'element', content: child as HTMLElement});
      }
    });

    let currentWord: Array<{type: 'text' | 'element', content: string | HTMLElement}> = [];
    
    segments.forEach((segment) => {
      if (segment.type === 'text') {
        const text = segment.content as string;
        const parts = text.split(/(\s+)/);
        
        parts.forEach((part) => {
          if (part.trim()) {
            currentWord.push({type: 'text', content: part});
          } else if (part) {
            if (currentWord.length > 0) {
              this.createWordFromSegments(currentWord, parent);
              currentWord = [];
            }
            const spaceSpan = this.renderer.createElement('span');
            spaceSpan.textContent = part;
            this.renderer.appendChild(parent, spaceSpan);
          }
        });
      } else {
        currentWord.push(segment);
      }
    });
    
    if (currentWord.length > 0) {
      this.createWordFromSegments(currentWord, parent);
    }
  }

  private createWordFromSegments(
    segments: Array<{type: 'text' | 'element', content: string | HTMLElement}>, 
    parent: HTMLElement
  ): void {
    const wordContainer = this.renderer.createElement('span');
    const wordSpan = this.renderer.createElement('span');

    this.renderer.setStyle(wordContainer, 'display', 'inline-block');
    this.renderer.setStyle(wordContainer, 'overflow', 'hidden');

    this.renderer.setStyle(wordSpan, 'display', 'inline-block');
    this.renderer.setStyle(wordSpan, 'transform', 'translateY(100%)');
    this.renderer.setStyle(wordSpan, 'willChange', 'transform');
    this.renderer.addClass(wordSpan, 'word-reveal-animated');

    segments.forEach(segment => {
      if (segment.type === 'text') {
        const textNode = this.renderer.createText(segment.content as string);
        this.renderer.appendChild(wordSpan, textNode);
      } else {
        const element = segment.content as HTMLElement;
        const clonedElement = this.renderer.createElement(element.tagName.toLowerCase());
        
        Array.from(element.attributes).forEach(attr => {
          this.renderer.setAttribute(clonedElement, attr.name, attr.value);
        });
        
        clonedElement.innerHTML = element.innerHTML;
        this.renderer.appendChild(wordSpan, clonedElement);
      }
    });

    this.renderer.appendChild(wordContainer, wordSpan);
    this.renderer.appendChild(parent, wordContainer);
  }

  ngOnDestroy(): void {
    if (this.animationTween) {
      this.animationTween.kill();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}