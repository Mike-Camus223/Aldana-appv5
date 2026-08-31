import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, OnDestroy, Renderer2, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { LoaderService } from '../../../../core/services/utils/loader.service';

gsap.registerPlugin(DrawSVGPlugin);

@Component({
  standalone: true,
  selector: 'app-loading-screen-v2',
  imports: [NgOptimizedImage],
  templateUrl: './loading-screen-v2.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./loading-screen-v2.component.css']
})
export class LoadingScreenV2Component implements AfterViewInit, OnDestroy {

  @ViewChild('screen') screen!: ElementRef<HTMLElement>;

  // Aldana Vilcabana SVG centrado
  @ViewChild('nameContainer') nameContainer!: ElementRef<HTMLElement>;
  @ViewChild('logoSvg') logoSvg!: ElementRef<SVGSVGElement>;

  // Contador Odometer (00 → 99)
  @ViewChild('counterContainer') counterContainer!: ElementRef<HTMLElement>;
  @ViewChild('tensStrip') tensStrip!: ElementRef<HTMLElement>;
  @ViewChild('unitsStrip') unitsStrip!: ElementRef<HTMLElement>;

  // 4 Fotos
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
      }, 100);
    }
  }

  private setupInitialStates(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Fondo inicial #FEF5EC
    if (this.screen?.nativeElement) {
      this.renderer.setStyle(this.screen.nativeElement, 'backgroundColor', '#FEF5EC');
    }

    // Logo y counter ocultos al inicio
    [
      this.logoSvg?.nativeElement,
      this.counterContainer?.nativeElement
    ].filter(Boolean).forEach(el => {
      this.renderer.setStyle(el, 'opacity', '0');
      this.renderer.setStyle(el, 'visibility', 'hidden');
    });

    // Reset tiras del odometer a posición inicial 0
    if (this.tensStrip?.nativeElement) {
      gsap.set(this.tensStrip.nativeElement, { yPercent: 0, force3D: true });
    }
    if (this.unitsStrip?.nativeElement) {
      gsap.set(this.unitsStrip.nativeElement, { yPercent: 0, force3D: true });
    }

    // Fotos ocultas
    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      if (box?.nativeElement) {
        this.renderer.setStyle(box.nativeElement, 'visibility', 'hidden');
        this.renderer.setStyle(box.nativeElement, 'display', 'block');
        gsap.set(box.nativeElement, { scale: 0.35, opacity: 0, transformOrigin: '50% 50%' });
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
      const timeoutId = setTimeout(() => startAnimation(), 2000);
      const checkImages = setInterval(() => {
        if (this.imagesLoaded >= this.totalImages) {
          clearTimeout(timeoutId);
          clearInterval(checkImages);
          startAnimation();
        }
      }, 100);
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

    // ══════════════════════════════════════════════════════════════════
    // FASE 1 — Fondo #FEF5EC + Dibujo SVG Aldana Vilcabana en #97ad92
    //          + Contador Odometer / Picker Wheel rodante continuo (00 → 99)
    // ══════════════════════════════════════════════════════════════════

    const svg = this.logoSvg?.nativeElement;
    const paths = svg ? (Array.from(svg.querySelectorAll('path')) as SVGPathElement[]) : [];

    // Ordenar paths de izquierda a derecha según su posición horizontal en el SVG
    const sorted = [...paths].sort((a, b) => {
      const ax = a.getBBox?.()?.x ?? 0;
      const bx = b.getBBox?.()?.x ?? 0;
      return ax - bx;
    });

    // Color aldy-medium-2 (#97ad92)
    const brandColor = '#97ad92';

    gsap.set(this.screen.nativeElement, { backgroundColor: '#FEF5EC' });
    gsap.set(svg, { opacity: 1, y: 15 });
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

    // Contador fade in
    tl.to(this.counterContainer.nativeElement, {
      opacity: 1,
      duration: 0.35,
      ease: 'power2.out'
    }, 0);

    // Deslizar el SVG suavemente hacia su posición central
    tl.to(svg, { y: 0, duration: 1.2, ease: 'expo.out' }, 0);

    // Dibujar cada path en secuencia de izquierda a derecha (efecto handwriting)
    const writeDuration = 0.9;
    const staggerGap = 0.055;
    const writeStart = 0.15;

    sorted.forEach((path, i) => {
      tl.to(
        path,
        { strokeDashoffset: 0, duration: writeDuration, ease: 'power2.inOut' },
        writeStart + i * staggerGap
      );
    });

    // Rellenar cada path cuando su trazo va al 60%
    sorted.forEach((path, i) => {
      const fillStart = writeStart + i * staggerGap + writeDuration * 0.6;
      tl.to(
        path,
        { fill: brandColor, strokeWidth: 0, strokeOpacity: 0, duration: 0.5, ease: 'power2.inOut' },
        fillStart
      );
    });

    // Duración total exacta del dibujo
    const totalDrawDuration = writeStart + (sorted.length - 1) * staggerGap + writeDuration * 0.6 + 0.5;

    // ─── Animación Odometer 00 → 99 (Estilo Adovasio) ───────────────
    // Columna decenas: 10 dígitos (0..9) -> desplazamiento final a 9 (-90%)
    if (this.tensStrip?.nativeElement) {
      tl.to(this.tensStrip.nativeElement, {
        yPercent: -90,
        duration: totalDrawDuration,
        ease: 'power2.inOut',
        force3D: true
      }, 0);
    }

    // Columna unidades: 31 dígitos -> desplazamiento final al último 9 (-96.774%)
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

    // ══════════════════════════════════════════════════════════════════
    // FASE 2 — Desaparecen en fade el logo y el contador
    // ══════════════════════════════════════════════════════════════════

    tl.addLabel('fadeOut', totalDrawDuration + 0.2);

    tl.to(
      [this.logoSvg.nativeElement, this.counterContainer.nativeElement],
      { opacity: 0, duration: 0.4, ease: 'power2.inOut' },
      'fadeOut'
    );

    // ══════════════════════════════════════════════════════════════════
    // FASE 3 — Secuencia fluida con overlap de imágenes:
    //          Box 1 → Box 2 → Box 3 → Box 4 escalando y desacelerando
    // ══════════════════════════════════════════════════════════════════

    const imgDuration = 0.8;
    const imgEase = 'power3.out';

    // Box 1: Entra escalando hacia su contenedor
    tl.fromTo(this.box1.nativeElement,
      { scale: 0.35, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      'fadeOut+=0.15'
    );

    // Box 2: Entra ANTES de que Box 1 termine
    tl.fromTo(this.box2.nativeElement,
      { scale: 0.35, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      'fadeOut+=0.55'
    );

    // Box 3: Entra ANTES de que Box 2 termine
    tl.fromTo(this.box3.nativeElement,
      { scale: 0.35, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      'fadeOut+=0.95'
    );

    // Box 4: Entra ANTES de que Box 3 termine
    tl.fromTo(this.box4.nativeElement,
      { scale: 0.35, opacity: 0 },
      { scale: 1, opacity: 1, duration: imgDuration, ease: imgEase, force3D: true },
      'fadeOut+=1.35'
    );

    // Box 4: El contenedor se expande suavemente a pantalla completa (100vw, 100vh)
    tl.to(this.box4.nativeElement, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      boxShadow: 'none',
      duration: 0.95,
      ease: 'power2.inOut',
      force3D: true
    }, 'fadeOut+=2.05');

    tl.addLabel('fullScreen', 'fadeOut+=3.0');

    // ══════════════════════════════════════════════════════════════════
    // FASE 4 — OPTIMIZACIÓN ANTI-LAG:
    //          Al tapar Box 4 toda la pantalla, removemos las fotos
    //          1, 2 y 3 (display: none) para liberar la GPU.
    //          Aparece Aldana Vilcabana centrado en blanco sobre Box 4.
    // ══════════════════════════════════════════════════════════════════

    tl.call(() => {
      // Ocultar y remover del render las fotos anteriores para 0 lag
      [this.box1.nativeElement, this.box2.nativeElement, this.box3.nativeElement].forEach(el => {
        el.style.display = 'none';
      });

      // SVG preparado en blanco
      sorted.forEach(p => gsap.set(p, { fill: '#ffffff', stroke: 'none', strokeOpacity: 0 }));
      gsap.set(this.logoSvg.nativeElement, { y: 0, opacity: 0 });
    }, [], 'fullScreen');

    tl.to(this.logoSvg.nativeElement, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    }, 'fullScreen+=0.1');

    // ══════════════════════════════════════════════════════════════════
    // FASE 5 — Transición suave y limpia a aldy-medium-2 (#97ad92),
    //          Box 4 se desvanece y se oculta, y el telón sube fluido.
    // ══════════════════════════════════════════════════════════════════

    tl.addLabel('colorTransition', 'fullScreen+=0.75');

    // Fondo del screen pasa a aldy-medium-2
    tl.to(this.screen.nativeElement, {
      backgroundColor: '#97ad92',
      duration: 0.6,
      ease: 'power2.inOut',
      onStart: () => {
        this.unblockScrollAndInteraction();
      }
    }, 'colorTransition');

    // Box 4 se desvanece suavemente
    tl.to(this.box4.nativeElement, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => {
        // Al terminar el desvanecimiento, remover Box 4 del render
        if (this.box4?.nativeElement) {
          this.box4.nativeElement.style.display = 'none';
        }
      }
    }, 'colorTransition');

    // SUBIDA DE TELÓN 100% FLUIDA (Cero imágenes pesadas en el DOM durante el movimiento)
    tl.to(this.screen.nativeElement, {
      y: '-100%',
      duration: 0.85,
      ease: 'power3.inOut',
      force3D: true,
      onComplete: () => {
        this.cleanupWillChange();
      }
    }, 'colorTransition+=0.68');
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
