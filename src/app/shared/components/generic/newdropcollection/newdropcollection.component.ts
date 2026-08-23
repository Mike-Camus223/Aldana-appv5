import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  Inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { gsap } from 'gsap';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';

@Component({
  selector: 'app-newdropcollection',
  standalone: true,
  imports: [
    CommonModule,
    WordRevealDirective,
    FadeUpLetterDirective
  ],
  templateUrl: './newdropcollection.component.html',
  styleUrls: ['./newdropcollection.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewdropcollectionComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() collection: any;
  @Input() isMobileView: boolean = false;
  @Input() canAnimate: boolean = true;

  @Output() collectionSelected = new EventEmitter<any>();

  @ViewChild('cardRoot', { static: false }) cardRootRef!: ElementRef<HTMLElement>;
  @ViewChild('collectionImage', { static: false }) collectionImageRef!: ElementRef<HTMLImageElement>;
  @ViewChildren(WordRevealDirective) wordReveals!: QueryList<WordRevealDirective>;
  @ViewChildren(FadeUpLetterDirective) fadeUpLetters!: QueryList<FadeUpLetterDirective>;

  private hasAnimated: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private hostRef: ElementRef<HTMLElement>
  ) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.canAnimate) {
        this.playEntryAnimation();
      } else if (this.cardRootRef?.nativeElement) {
        gsap.killTweensOf(this.cardRootRef.nativeElement);
        gsap.set(this.cardRootRef.nativeElement, { opacity: 0, y: 22 });
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collection']) {
      this.hasAnimated = false;
    }
    if (changes['canAnimate']) {
      if (this.canAnimate) {
        if (isPlatformBrowser(this.platformId)) {
          this.playEntryAnimation();
        }
      } else {
        this.hasAnimated = false;
        if (isPlatformBrowser(this.platformId) && this.cardRootRef?.nativeElement) {
          gsap.killTweensOf(this.cardRootRef.nativeElement);
          gsap.set(this.cardRootRef.nativeElement, { opacity: 0, y: 22 });
        }
      }
    }
  }

  onClick(): void {
    this.collectionSelected.emit(this.collection);
  }

  private playEntryAnimation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.cardRootRef) return;
    this.hasAnimated = true;
    const cardEl = this.cardRootRef.nativeElement;
    const imgEl = this.collectionImageRef?.nativeElement;
    const delay = this.computeStaggerDelay();

    gsap.killTweensOf(cardEl);
    gsap.fromTo(cardEl,
      { opacity: 0, y: 22, willChange: 'opacity, transform' },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power3.out',
        delay: delay,
        clearProps: 'willChange',
        overwrite: 'auto',
        onComplete: () => {
          this.triggerChildDirectives();
        }
      }
    );

    if (imgEl) {
      gsap.killTweensOf(imgEl);
      gsap.fromTo(imgEl,
        { scale: 1.04 },
        {
          scale: 1.0,
          duration: 0.75,
          ease: 'power3.out',
          delay: delay,
          clearProps: 'transform,scale,willChange',
          overwrite: 'auto'
        }
      );
    }
  }

  private triggerChildDirectives(): void {
    if (this.wordReveals) {
      this.wordReveals.forEach(directive => directive.triggerAnimation());
    }
    if (this.fadeUpLetters) {
      this.fadeUpLetters.forEach(directive => directive.triggerAnimation());
    }
  }

  private computeStaggerDelay(): number {
    try {
      const host = this.hostRef.nativeElement;
      const parent = host.parentElement;
      if (!parent) return 0;
      const children = Array.from(parent.children);
      const index = children.indexOf(host);
      return Math.max(0, index) * 0.045;
    } catch {
      return 0;
    }
  }

  ngOnDestroy(): void {
    if (this.cardRootRef?.nativeElement) {
      gsap.killTweensOf(this.cardRootRef.nativeElement);
    }
    if (this.collectionImageRef?.nativeElement) {
      gsap.killTweensOf(this.collectionImageRef.nativeElement);
    }
  }
}
