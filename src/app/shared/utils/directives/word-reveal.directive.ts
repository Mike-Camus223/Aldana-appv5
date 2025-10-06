import { AfterViewInit, Directive, ElementRef, Renderer2, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import gsap from 'gsap';
import { LoaderService } from '../../../core/services/utils/loader.service';

@Directive({
  selector: '[appWordReveal]',
  standalone: true,
})
export class WordRevealDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private originalContent: string = '';
  private animationSetup = false;
  private animationTween: gsap.core.Tween | null = null;

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      return;
    }
    
    this.originalContent = this.el.nativeElement.innerHTML || this.el.nativeElement.textContent || '';
    
    this.loaderService.currentLoader$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentLoader) => {
        if (currentLoader === null) {
          this.loaderService.animationsEnabled$
            .pipe(takeUntil(this.destroy$))
            .subscribe((enabled: boolean) => {
              if (enabled && !this.animationSetup) {
                setTimeout(() => {
                  this.setupAnimation();
                }, 50);
              }
            });
        } else {
          this.resetAnimation();
        }
      });
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
    if (this.animationSetup) return;
    this.animationSetup = true;

    if (!isPlatformBrowser(this.platformId)) {
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      return;
    }

    requestAnimationFrame(() => {
      try {
        const nativeElement = this.el.nativeElement;
        
        if (!nativeElement || !this.originalContent.trim()) {
          this.renderer.setStyle(nativeElement, 'opacity', '1');
          return;
        }
        
        if (nativeElement.innerHTML && nativeElement.innerHTML.includes('<span')) {
          this.setupAnimationWithHTML();
        } else {
          this.setupAnimationWithText();
        }

      } catch (error) {
        console.error('Error setting up word reveal animation:', error);
        this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      }
    });
  }

  private createWordRevealAnimation(element: HTMLElement): void {
    const allWordSpans = element.querySelectorAll('span > span');

    if (allWordSpans.length > 0) {
      this.animationTween = gsap.to(allWordSpans, {
        y: 0,
        ease: 'cubic-bezier(0.77, 0, 0.175, 1)',
        duration: 0.7,
        stagger: 0.05,
        delay: 0.05,
        scrollTrigger: {
          trigger: element,
          start: 'top 90%',
          toggleActions: 'play none none none',
          onEnter: () => {
            this.renderer.setStyle(element, 'opacity', '1');
          },
        },
        onComplete: () => {
          allWordSpans.forEach((span: any) => {
            span.style.willChange = 'auto';
          });
        }
      });
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

    const tempDiv = this.renderer.createElement('div');
    tempDiv.innerHTML = this.originalContent;
    
    const childNodes = Array.from(tempDiv.childNodes);
    
    childNodes.forEach((node: any) => {
      if (node.nodeType === Node.TEXT_NODE) {
        this.processTextNode(node, wrapper);
      } else {
        const clonedNode = node.cloneNode(true);
        this.renderer.appendChild(wrapper, clonedNode);
      }
    });

    nativeElement.innerHTML = '';
    this.renderer.appendChild(nativeElement, wrapper);
    this.createWordRevealAnimation(nativeElement);
  }

  private setupAnimationWithText(): void {
    const nativeElement = this.el.nativeElement;
    const text = nativeElement.textContent?.trim() || '';
    
    if (!text) {
      this.renderer.setStyle(nativeElement, 'opacity', '1');
      return;
    }
    
    nativeElement.innerHTML = '';

    const wrapper = this.renderer.createElement('div');
    this.renderer.setStyle(wrapper, 'display', 'block');
    this.renderer.setStyle(wrapper, 'overflow', 'hidden');
    this.renderer.setStyle(wrapper, 'width', '100%');

    const words = text.split(/(\s+)/);
    
    words.forEach((word: string) => {
      if (word.trim()) {
        this.createWordElement(word, wrapper);
      } else if (word) {
        const spaceSpan = this.renderer.createElement('span');
        spaceSpan.textContent = word;
        this.renderer.appendChild(wrapper, spaceSpan);
      }
    });

    this.renderer.appendChild(nativeElement, wrapper);
    this.createWordRevealAnimation(nativeElement);
  }

  private processTextNode(node: any, wrapper: HTMLElement): void {
    const text = node.textContent || '';
    const words = text.split(/(\s+)/);
    
    words.forEach((word: string) => {
      if (word.trim()) {
        this.createWordElement(word, wrapper);
      } else if (word) {
        const spaceSpan = this.renderer.createElement('span');
        spaceSpan.textContent = word;
        this.renderer.appendChild(wrapper, spaceSpan);
      }
    });
  }

  private createWordElement(word: string, wrapper: HTMLElement): void {
    const wordContainer = this.renderer.createElement('span');
    const wordSpan = this.renderer.createElement('span');

    this.renderer.setStyle(wordContainer, 'display', 'inline-block');
    this.renderer.setStyle(wordContainer, 'overflow', 'hidden');
    this.renderer.setStyle(wordContainer, 'marginRight', '0.3em');
    this.renderer.setStyle(wordContainer, 'verticalAlign', 'top');

    this.renderer.setStyle(wordSpan, 'display', 'inline-block');
    this.renderer.setStyle(wordSpan, 'transform', 'translateY(100%)');
    this.renderer.setStyle(wordSpan, 'willChange', 'transform');

    const textNode = this.renderer.createText(word);
    this.renderer.appendChild(wordSpan, textNode);
    this.renderer.appendChild(wordContainer, wordSpan);
    this.renderer.appendChild(wrapper, wordContainer);
  }

  ngOnDestroy(): void {
    if (this.animationTween) {
      this.animationTween.kill();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}