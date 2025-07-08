import { AfterViewInit, Directive, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import gsap from 'gsap';
import { LoaderService } from '../../../core/services/utils/loader.service';

@Directive({
  selector: '[appWordReveal]',
  standalone: true,
})
export class WordRevealDirective implements AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private loaderService: LoaderService
  ) {
    this.renderer.setStyle(this.el.nativeElement, 'visibility', 'hidden');
  }

  ngAfterViewInit(): void {
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        if (enabled) {
          this.setupAnimation();
        }
      });
  }

  private setupAnimation(): void {
    const nativeElement = this.el.nativeElement;
    const text = nativeElement.textContent?.trim() || '';
    nativeElement.innerHTML = '';

    const wrapper = this.renderer.createElement('div');
    this.renderer.setStyle(wrapper, 'display', 'inline-block');
    this.renderer.setStyle(wrapper, 'overflow', 'hidden');

    text.split(' ').forEach((word: string) => {
      const wordContainer = this.renderer.createElement('span');
      const wordSpan = this.renderer.createElement('span');

      this.renderer.setStyle(wordContainer, 'display', 'inline-block');
      this.renderer.setStyle(wordContainer, 'overflow', 'hidden');
      this.renderer.setStyle(wordContainer, 'marginRight', '0.3em');

      this.renderer.setStyle(wordSpan, 'display', 'inline-block');
      this.renderer.setStyle(wordSpan, 'transform', 'translateY(100%)');

      const textNode = this.renderer.createText(word);
      this.renderer.appendChild(wordSpan, textNode);
      this.renderer.appendChild(wordContainer, wordSpan);
      this.renderer.appendChild(wrapper, wordContainer);
    });

    this.renderer.appendChild(nativeElement, wrapper);

    const allWordSpans = nativeElement.querySelectorAll('span > span');

    gsap.to(allWordSpans, {
      y: 0,
      ease: 'cubic-bezier(0.77, 0, 0.175, 1)',
      duration: 0.7,
      stagger: 0.05,
      delay: 0.05,
      scrollTrigger: {
        trigger: nativeElement,
        start: 'top 90%',
        toggleActions: 'play none none none',
        onEnter: () => {
          this.renderer.setStyle(nativeElement, 'visibility', 'visible');
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}