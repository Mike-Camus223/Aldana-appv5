import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, OnDestroy, Renderer2, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage, NgFor } from '@angular/common';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { LoaderService } from '../../../../core/services/utils/loader.service';

gsap.registerPlugin(DrawSVGPlugin);

@Component({
  standalone: true,
  selector: 'app-loading-screen-v2',
  imports: [NgOptimizedImage, NgFor],
  templateUrl: './loading-screen-v2.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./loading-screen-v2.component.css']
})
export class LoadingScreenV2Component implements AfterViewInit, OnDestroy {

  @ViewChild('screen') screen!: ElementRef<HTMLElement>;

  // Logos (original — solo se agrega clase .active al logoSvg)
  @ViewChild('logoTextGroup') logoTextGroup!: ElementRef<HTMLElement>;
  @ViewChild('logoContainer') logoContainer!: ElementRef<HTMLElement>;
  @ViewChild('logoSvg') logoSvg!: ElementRef<SVGElement>;
  @ViewChild('nameContainer') nameContainer!: ElementRef<HTMLElement>;
  @ViewChild('vilcabanaSvg') vilcabanaSvg!: ElementRef<SVGElement>;

  // Wheel picker (tens + units → 0 a 99)
  @ViewChild('counterContainer') counterContainer!: ElementRef<HTMLElement>;
  @ViewChild('tensTrack') tensTrack!: ElementRef<HTMLElement>;
  @ViewChild('unitsTrack') unitsTrack!: ElementRef<HTMLElement>;

  // Fotos centradas (4 boxes)
  @ViewChild('box1') box1!: ElementRef<HTMLElement>;
  @ViewChild('box2') box2!: ElementRef<HTMLElement>;
  @ViewChild('box3') box3!: ElementRef<HTMLElement>;
  @ViewChild('box4') box4!: ElementRef<HTMLElement>;

  @Output() loadingFinished = new EventEmitter<void>();

  readonly digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

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

    // Logos y wheel picker ocultos al inicio
    [
      this.logoSvg?.nativeElement,
      this.nameContainer?.nativeElement,
      this.counterContainer?.nativeElement
    ].filter(Boolean).forEach(el => {
      this.renderer.setStyle(el, 'opacity', '0');
      this.renderer.setStyle(el, 'visibility', 'hidden');
    });

    // Fotos ocultas: scale(0) vía gsap.set, y visibility hidden
    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      if (box?.nativeElement) {
        this.renderer.setStyle(box.nativeElement, 'visibility', 'hidden');
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
      this.screen.nativeElement,
      this.logoSvg.nativeElement,
      this.nameContainer.nativeElement,
      this.counterContainer.nativeElement,
      this.box1.nativeElement,
      this.box2.nativeElement,
      this.box3.nativeElement,
      this.box4.nativeElement
    ].forEach(el => {
      this.renderer.setStyle(el, 'visibility', 'visible');
      (el as HTMLElement).style.backfaceVisibility = 'hidden';
    });

    this.screen.nativeElement.offsetHeight; // force reflow
  }

  private createAnimationSequence(): void {
    this.timeline = gsap.timeline({
      onComplete: () => this.hideAndComplete()
    });

    const tl = this.timeline;
    const boxes = [this.box1, this.box2, this.box3, this.box4];

    // ════════════════════════════════════════════════════════
    // FASE 1 — Logo AV + Aldana Vilcabana se dibujan (animación
    //          CSS ORIGINAL sin cambios) mientras wheel picker
    //          cuenta 00 → 99 a la IZQUIERDA de los logos
    // ════════════════════════════════════════════════════════

    // Estado inicial GSAP — el logo AV arranca desde opacity 0 + scale 0
    // (lo mismo que hacía el original con logoSvg)
    gsap.set(this.logoSvg.nativeElement, { scale: 0, opacity: 0, force3D: true });
    gsap.set(this.nameContainer.nativeElement, { opacity: 0, y: 20, force3D: true });
    gsap.set(this.counterContainer.nativeElement, { opacity: 0 });

    // Wheel picker fade in
    tl.to(this.counterContainer.nativeElement, {
      opacity: 1,
      duration: 0.35,
      ease: 'power2.out'
    }, 0);

    // Logo AV aparece con scale — IDÉNTICO al original
    tl.to(this.logoSvg.nativeElement, {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      ease: 'back.out(1.8)',
      force3D: true,
      onComplete: () => {
        // Activa la animación CSS DrawSVG ORIGINAL (svg-elem-1..5)
        this.logoSvg.nativeElement.classList.add('active');
      }
    }, 0);

    // Nombre "Aldana Vilcabana" sube — IDÉNTICO al original
    tl.to(this.nameContainer.nativeElement, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.1');

    // ─── SVG draw de Aldana Vilcabana — LÓGICA ORIGINAL INTACTA ───────────
    const svg = this.vilcabanaSvg.nativeElement;
    const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];

    const sortedPaths = [...paths].sort((a, b) => {
      const ax = a.getBBox?.()?.x ?? 0;
      const bx = b.getBBox?.()?.x ?? 0;
      return ax - bx;
    });

    sortedPaths.forEach(path => {
      const len = path.getTotalLength?.() ?? 0;
      gsap.set(path, {
        fill: 'none',
        stroke: '#d2e4cc',
        strokeWidth: 0.9,
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity: 1
      });
    });

    const writeDuration = 0.9;
    const staggerGap = 0.055;
    const writeStart = tl.duration(); // relativo al punto donde el timeline está ahora

    sortedPaths.forEach((path, i) => {
      tl.to(
        path,
        { strokeDashoffset: 0, duration: writeDuration, ease: 'power2.inOut' },
        writeStart + i * staggerGap
      );
    });

    sortedPaths.forEach((path, i) => {
      const fillStart = writeStart + i * staggerGap + writeDuration * 0.6;
      tl.to(
        path,
        { fill: '#d2e4cc', strokeWidth: 0, strokeOpacity: 0, duration: 0.5, ease: 'power2.inOut' },
        fillStart
      );
    });
    // ─── fin lógica original ───────────────────────────────────────────────

    // Wheel picker: 00 → 99, sincronizado con el draw del SVG
    const lastFillStart = writeStart + (sortedPaths.length - 1) * staggerGap + writeDuration * 0.6;
    const drawEnd = lastFillStart + 0.5;

    const counterObj = { val: 0 };
    tl.to(counterObj, {
      val: 99,
      duration: drawEnd,      // dura exactamente lo mismo que el draw
      ease: 'none',
      onUpdate: () => this.setCounterDigits(Math.round(counterObj.val))
    }, 0);

    // ════════════════════════════════════════════════════════
    // FASE 2 — SVGs pasan a blanco, todo el bloque logos +
    //          picker hace fade out elegante en su posición
    // ════════════════════════════════════════════════════════

    tl.addLabel('fadeOut', drawEnd + 0.2);

    // SVG Aldana Vilcabana → blanco
    tl.to(sortedPaths, {
      fill: '#ffffff',
      stroke: '#ffffff',
      duration: 0.3,
      ease: 'power2.out'
    }, 'fadeOut');

    // Logo AV → invertido a blanco
    tl.to(this.logoSvg.nativeElement, {
      filter: 'brightness(0) invert(1)',
      duration: 0.3,
      ease: 'power2.out'
    }, 'fadeOut');

    // Fade out completo del bloque
    tl.to(
      [this.logoTextGroup.nativeElement, this.counterContainer.nativeElement],
      { opacity: 0, duration: 0.45, ease: 'power2.inOut' },
      'fadeOut+=0.2'
    );

    // ════════════════════════════════════════════════════════
    // FASE 3 — 4 fotos centradas aparecen en cascade de scale,
    //          cada una tapando a la anterior, la última crece
    //          hasta cubrir la pantalla completa
    // ════════════════════════════════════════════════════════

    const stagger = 0.2;

    boxes.forEach((box, i) => {
      const isLast = i === boxes.length - 1;
      const startAt = `fadeOut+=${0.3 + i * stagger}`;

      // Foto i: scale 0 → tamaño intermedio rápido
      tl.to(box.nativeElement, {
        scale: isLast ? 0.7 : 0.55 + i * 0.07,
        opacity: 1,
        duration: 0.35,
        ease: 'back.out(1.1)',
        force3D: true
      }, startAt);

      if (isLast) {
        // La última foto crece hasta llenar la pantalla
        tl.to(box.nativeElement, {
          scale: 6,
          duration: 0.6,
          ease: 'power2.in',
          force3D: true
        }, `fadeOut+=${0.3 + i * stagger + 0.38}`);
      }
    });

    const lastPhotoExpandEnd = `fadeOut+=${0.3 + (boxes.length - 1) * stagger + 0.38 + 0.6}`;
    tl.addLabel('fullScreen', lastPhotoExpandEnd);

    // ════════════════════════════════════════════════════════
    // FASE 4 — El SVG "Aldana Vilcabana" (en BLANCO) aparece
    //          con fade centrado, sobre la foto expandida
    // ════════════════════════════════════════════════════════

    // Reposicionar el bloque de logos al centro antes de hacerlo visible
    tl.call(() => {
      gsap.set(this.logoTextGroup.nativeElement, { xPercent: 0, x: 0 });
      // Asegurar paths blancos
      sortedPaths.forEach(p => gsap.set(p, { fill: '#ffffff', stroke: 'none', strokeOpacity: 0 }));
      gsap.set(this.logoSvg.nativeElement, { filter: 'brightness(0) invert(1)' });
    }, [], 'fullScreen');

    tl.to(this.logoTextGroup.nativeElement, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    }, 'fullScreen+=0.05');

    // ════════════════════════════════════════════════════════
    // FASE 5 — La imagen de fondo transiciona al color del telón
    //          (#AEC2A9), luego el screen SUBE completamente
    //          llevándose el SVG "Aldana Vilcabana" consigo
    // ════════════════════════════════════════════════════════

    tl.to(this.screen.nativeElement, {
      backgroundColor: '#AEC2A9',
      duration: 0.7,
      ease: 'power2.out',
      onStart: () => {
        this.unblockScrollAndInteraction();
      }
    }, 'fullScreen+=0.55');

    // El screen entero sube — lleva consigo el SVG centrado
    tl.to(this.screen.nativeElement, {
      y: '-100%',
      duration: 0.65,
      ease: 'power2.inOut',
      onComplete: () => {
        this.cleanupWillChange();
      }
    }, 'fullScreen+=1.1');
  }

  /** Mueve los tracks del wheel picker según el número 0–99 */
  private setCounterDigits(num: number): void {
    const v = Math.max(0, Math.min(99, num));
    const tens = Math.floor(v / 10);
    const units = v % 10;

    // CSS custom property --idx controla qué dígito es visible
    this.tensTrack?.nativeElement.style.setProperty('--idx', tens.toString());
    this.unitsTrack?.nativeElement.style.setProperty('--idx', units.toString());
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
      this.logoSvg?.nativeElement,
      this.nameContainer?.nativeElement,
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