import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, OnDestroy, Renderer2, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { LoaderService } from '../../../../core/services/utils/loader.service';

gsap.registerPlugin(DrawSVGPlugin);

@Component({
  standalone: true,
  selector: 'app-loading-screen',
  imports: [NgOptimizedImage],
  templateUrl: './loading-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./loading-screen.component.css']
})
export class LoadingScreenComponent implements AfterViewInit, OnDestroy {

  @ViewChild('screen') screen!: ElementRef<HTMLElement>;
  @ViewChild('nameContainer') nameContainer!: ElementRef<HTMLElement>;
  @ViewChild('logoSvg') logoSvg!: ElementRef<SVGSVGElement>;
  @ViewChild('counterContainer') counterContainer!: ElementRef<HTMLElement>;
  @ViewChild('tensStrip') tensStrip!: ElementRef<HTMLElement>;
  @ViewChild('unitsStrip') unitsStrip!: ElementRef<HTMLElement>;
  @ViewChild('box1') box1!: ElementRef<HTMLElement>;
  @ViewChild('box2') box2!: ElementRef<HTMLElement>;
  @ViewChild('box3') box3!: ElementRef<HTMLElement>;
  @ViewChild('box4') box4!: ElementRef<HTMLElement>;

  @Output() loadingFinished = new EventEmitter<void>();

  private isScrollBlocked = false;
  private imagesLoaded = 0;
  private totalImages = 4;
  private wheelListener?: (event: WheelEvent) => void;
  private touchMoveListener?: (event: TouchEvent) => void;
  private keydownListener?: (event: KeyboardEvent) => void;
  private timeline?: gsap.core.Timeline;
  private isAnimationComplete = false;

  constructor(
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.blockScrollAndInteraction();
      this.setupInitialStates();

      setTimeout(() => {
        this.initializeAnimation();
      }, 50);
    }
  }

  private setupInitialStates(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.screen?.nativeElement) {
      this.renderer.setStyle(this.screen.nativeElement, 'backgroundColor', '#FEF5EC');
    }

    [
      this.logoSvg?.nativeElement,
      this.counterContainer?.nativeElement
    ].filter(Boolean).forEach(el => {
      this.renderer.setStyle(el, 'opacity', '0');
      this.renderer.setStyle(el, 'visibility', 'hidden');
    });

    if (this.tensStrip?.nativeElement) {
      gsap.set(this.tensStrip.nativeElement, { yPercent: 0, force3D: true });
    }
    if (this.unitsStrip?.nativeElement) {
      gsap.set(this.unitsStrip.nativeElement, { yPercent: 0, force3D: true });
    }

    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      if (box?.nativeElement) {
        this.renderer.setStyle(box.nativeElement, 'visibility', 'hidden');
        this.renderer.setStyle(box.nativeElement, 'display', 'block');
        gsap.set(box.nativeElement, { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
      }
    });

    this.setupImagePreloading();
  }

  private setupImagePreloading(): void {
    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      if (box?.nativeElement) {
        const img = box.nativeElement.querySelector('img') as HTMLImageElement | null;
        if (img) {
          img.loading = 'eager';
          img.fetchPriority = 'high';
          if (img.complete) {
            this.onImageLoad();
          } else {
            img.addEventListener('load', this.onImageLoad.bind(this));
            img.addEventListener('error', this.onImageLoad.bind(this));
          }
        }
      }
    });
  }

  private onImageLoad(): void {
    this.imagesLoaded++;
  }

  private initializeAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.hideAndComplete();
      return;
    }

    const startAnimation = () => {
      this.blockScrollAndInteraction();
      this.optimizePerformance();
      this.createAnimationSequence();
    };

    if (this.imagesLoaded >= this.totalImages) {
      startAnimation();
    } else {
      const timeoutId = setTimeout(() => startAnimation(), 1500);
      const checkImages = setInterval(() => {
        if (this.imagesLoaded >= this.totalImages) {
          clearTimeout(timeoutId);
          clearInterval(checkImages);
          startAnimation();
        }
      }, 50);
    }
  }

  private optimizePerformance(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    [
      this.screen?.nativeElement,
      this.logoSvg?.nativeElement,
      this.counterContainer?.nativeElement,
      this.box1?.nativeElement,
      this.box2?.nativeElement,
      this.box3?.nativeElement,
      this.box4?.nativeElement
    ].filter(Boolean).forEach(el => {
      this.renderer.setStyle(el, 'visibility', 'visible');
      (el as HTMLElement).style.backfaceVisibility = 'hidden';
    });

    if (this.screen?.nativeElement) {
      this.screen.nativeElement.offsetHeight;
    }
  }

  private createAnimationSequence(): void {
    this.timeline = gsap.timeline({
      onComplete: () => this.hideAndComplete()
    });

    const tl = this.timeline;

    const svg = this.logoSvg?.nativeElement;
    const paths = svg ? (Array.from(svg.querySelectorAll('path')) as SVGPathElement[]) : [];

    const sorted = [...paths].sort((a, b) => {
      const ax = a.getBBox?.()?.x ?? 0;
      const bx = b.getBBox?.()?.x ?? 0;
      return ax - bx;
    });

    const brandColor = '#97ad92';

    gsap.set(this.screen.nativeElement, { backgroundColor: '#FEF5EC' });
    gsap.set(svg, { opacity: 1, y: 12 });
    gsap.set(this.counterContainer.nativeElement, { opacity: 0 });

    sorted.forEach(path => {
      const len = path.getTotalLength?.() ?? 0;
      gsap.set(path, {
        fill: 'none',
        stroke: brandColor,
        strokeWidth: 0.9,
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity: 1
      });
    });

    tl.to(this.counterContainer.nativeElement, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    }, 0);

    tl.to(svg, { y: 0, duration: 1.0, ease: 'expo.out' }, 0);

    const writeDuration = 0.85;
    const staggerGap = 0.048;
    const writeStart = 0.10;

    sorted.forEach((path, i) => {
      tl.to(
        path,
        { strokeDashoffset: 0, duration: writeDuration, ease: 'power2.inOut' },
        writeStart + i * staggerGap
      );
    });

    sorted.forEach((path, i) => {
      const fillStart = writeStart + i * staggerGap + writeDuration * 0.6;
      tl.to(
        path,
        { fill: brandColor, strokeWidth: 0, strokeOpacity: 0, duration: 0.45, ease: 'power2.inOut' },
        fillStart
      );
    });

    const totalDrawDuration = 1.95;

    if (this.tensStrip?.nativeElement) {
      tl.to(this.tensStrip.nativeElement, {
        yPercent: -90,
        duration: totalDrawDuration,
        ease: 'power2.inOut',
        force3D: true
      }, 0);
    }

    if (this.unitsStrip?.nativeElement) {
      const totalUnits = 31;
      const targetPercent = -((totalUnits - 1) / totalUnits) * 100;
      tl.to(this.unitsStrip.nativeElement, {
        yPercent: targetPercent,
        duration: totalDrawDuration,
        ease: 'power2.inOut',
        force3D: true
      }, 0);
    }

    tl.to(
      [this.logoSvg.nativeElement, this.counterContainer.nativeElement],
      { opacity: 0, duration: 0.25, ease: 'power2.inOut' },
      1.95
    );

    const imgDuration = 0.55;
    const imgEase = 'power2.out';

    // Box 1
    tl.fromTo(this.box1.nativeElement,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      2.10
    );

    // Box 2
    tl.fromTo(this.box2.nativeElement,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      2.38
    );

    // Box 3
    tl.fromTo(this.box3.nativeElement,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      2.66
    );

    // Box 4
    tl.fromTo(this.box4.nativeElement,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      2.94
    );

    // Box 4 expansion
    tl.to(this.box4.nativeElement, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      boxShadow: 'none',
      duration: 0.70,
      ease: 'power3.inOut',
      force3D: true
    }, 3.35);

    tl.call(() => {
      [this.box1.nativeElement, this.box2.nativeElement, this.box3.nativeElement].forEach(el => {
        el.style.display = 'none';
      });

      sorted.forEach(p => gsap.set(p, { fill: '#ffffff', stroke: 'none', strokeOpacity: 0 }));
      gsap.set(this.logoSvg.nativeElement, { y: 0, opacity: 0 });
    }, [], 4.05);

    tl.to(this.logoSvg.nativeElement, {
      opacity: 1,
      duration: 0.30,
      ease: 'power2.out'
    }, 4.05);

    tl.to(this.screen.nativeElement, {
      backgroundColor: '#97ad92',
      duration: 0.30,
      ease: 'power2.inOut',
      onStart: () => {
        this.unblockScrollAndInteraction();
      }
    }, 4.35);

    tl.to(this.box4.nativeElement, {
      opacity: 0,
      duration: 0.30,
      ease: 'power2.inOut',
      onComplete: () => {
        if (this.box4?.nativeElement) {
          this.box4.nativeElement.style.display = 'none';
        }
      }
    }, 4.35);

    tl.to(this.screen.nativeElement, {
      y: '-100%',
      duration: 0.77,
      ease: 'power3.inOut',
      force3D: true,
      onComplete: () => {
        this.cleanupWillChange();
      }
    }, 4.55);
  }

  private hideAndComplete(): void {
    this.isAnimationComplete = true;
    this.loaderService.setAnimationsEnabled(true);
    this.unblockScrollAndInteraction();

    if (this.screen?.nativeElement) {
      this.renderer.setStyle(this.screen.nativeElement, 'display', 'none');
    }

    this.loadingFinished.emit();
    this.loaderService.finish('main');
  }

  private cleanupWillChange(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    [
      this.screen?.nativeElement,
      this.nameContainer?.nativeElement,
      this.logoSvg?.nativeElement,
      this.counterContainer?.nativeElement
    ].filter(Boolean).forEach((el: any) => {
      if (el?.style) {
        el.style.willChange = 'auto';
        el.style.transform = '';
        el.style.backfaceVisibility = '';
      }
    });

    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      const img = box?.nativeElement?.querySelector('img') as HTMLElement | null;
      if (img?.style) img.style.willChange = 'auto';
    });
  }

  private blockScrollAndInteraction(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isScrollBlocked) return;

    this.isScrollBlocked = true;

    if (typeof document !== 'undefined' && document.body) {
      this.renderer.addClass(document.body, 'reserve-scrollbar-space');
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      this.renderer.setStyle(document.body, 'overscrollBehavior', 'none');
    }

    this.wheelListener = (e: WheelEvent) => { e.preventDefault(); e.stopPropagation(); };
    this.touchMoveListener = (e: TouchEvent) => { e.preventDefault(); e.stopPropagation(); };
    this.keydownListener = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault(); e.stopPropagation();
      }
    };

    document.addEventListener('wheel', this.wheelListener, { passive: false, capture: true });
    document.addEventListener('touchmove', this.touchMoveListener, { passive: false, capture: true });
    document.addEventListener('keydown', this.keydownListener, { capture: true });
  }

  private unblockScrollAndInteraction(): void {
    if (!this.isScrollBlocked) return;

    this.isScrollBlocked = false;

    if (typeof document !== 'undefined' && document.body) {
      this.renderer.removeClass(document.body, 'reserve-scrollbar-space');
      this.renderer.removeStyle(document.body, 'overflow');
      this.renderer.removeStyle(document.body, 'overscrollBehavior');
    }

    if (this.wheelListener) document.removeEventListener('wheel', this.wheelListener, { capture: true } as any);
    if (this.touchMoveListener) document.removeEventListener('touchmove', this.touchMoveListener, { capture: true } as any);
    if (this.keydownListener) document.removeEventListener('keydown', this.keydownListener, { capture: true } as any);
  }

  ngOnDestroy(): void {
    this.unblockScrollAndInteraction();

    if (this.timeline) {
      this.timeline.kill();
      this.timeline = undefined;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.cleanupWillChange();
    }
  }
}
