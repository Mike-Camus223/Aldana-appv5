import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, OnDestroy, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { LoaderService } from '../../../../core/services/utils/loader.service';

@Component({
  standalone: true,
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css']
})
export class LoadingScreenComponent implements AfterViewInit, OnDestroy {

  @ViewChild('screen') screen!: ElementRef;
  @ViewChild('circleGroup') circleGroup!: ElementRef;
  @ViewChild('box1') box1!: ElementRef;
  @ViewChild('box2') box2!: ElementRef;
  @ViewChild('box3') box3!: ElementRef;
  @ViewChild('box4') box4!: ElementRef;
  @ViewChild('letterA') letterA!: ElementRef;
  @ViewChild('letterV') letterV!: ElementRef;
  @ViewChild('name') name!: ElementRef;

  @Output() loadingFinished = new EventEmitter<void>();

  private isScrollBlocked = false;
  private wheelListener?: (event: WheelEvent) => void;
  private touchMoveListener?: (event: TouchEvent) => void;
  private keydownListener?: (event: KeyboardEvent) => void;
  private timeline?: gsap.core.Timeline;

  constructor(
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {
          this.initializeAnimation();
        });
      } else {
        setTimeout(() => {
          this.initializeAnimation();
        }, 0);
      }
    }
  }

  private initializeAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loadingFinished.emit();
      this.loaderService.finish('main');
      return;
    }

    this.blockScrollAndInteraction();
    this.preloadElements();
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.unblockScrollAndInteraction();
        this.loadingFinished.emit();
        this.loaderService.finish('main');
      }
    });

    this.setupInitialStates();
    this.createAnimationSequence();
  }

  private preloadElements(): void {
    const elements = [
      this.box1.nativeElement,
      this.box2.nativeElement,
      this.box3.nativeElement,
      this.box4.nativeElement,
      this.letterA.nativeElement,
      this.letterV.nativeElement,
      this.name.nativeElement,
      this.circleGroup.nativeElement,
      this.screen.nativeElement
    ];

    elements.forEach(el => {
      el.offsetHeight; 
    });

    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      const img = box.nativeElement.querySelector('img');
      if (img) {
        gsap.set(img, { 
          force3D: true,
          transformOrigin: "center center",
          backfaceVisibility: "hidden"
        });
        img.style.willChange = 'filter, transform';
      }
    });

    [this.letterA.nativeElement, this.letterV.nativeElement, this.name.nativeElement].forEach(el => {
      gsap.set(el, { 
        force3D: true,
        transformOrigin: "center center",
        backfaceVisibility: "hidden"
      });
      el.style.willChange = 'transform, opacity';
    });

    gsap.set([this.screen.nativeElement, this.circleGroup.nativeElement], {
      force3D: true,
      backfaceVisibility: "hidden"
    });
    
    this.screen.nativeElement.style.willChange = 'transform, background-color';
    this.circleGroup.nativeElement.style.willChange = 'opacity';
  }

  private setupInitialStates(): void {
    const boxes = [this.box1, this.box2, this.box3, this.box4];
    
    gsap.set(boxes.map(b => b.nativeElement), { 
      scale: 1,
      force3D: true,
      transformOrigin: "center center"
    });

    boxes.forEach(box => {
      const img = box.nativeElement.querySelector('img');
      if (img) {
        gsap.set(img, { 
          filter: 'grayscale(100%)',
          force3D: true
        });
      }
    });

    gsap.set(this.letterA.nativeElement, { 
      x: -90, 
      opacity: 0,
      force3D: true
    });
    
    gsap.set(this.letterV.nativeElement, { 
      x: 90, 
      opacity: 0,
      force3D: true
    });

    gsap.set(this.name.nativeElement, { 
      opacity: 0, 
      y: 20,
      force3D: true
    });
  }

  private createAnimationSequence(): void {
    const tl = this.timeline!;

    tl.from(this.box1.nativeElement, { 
      y: '-40vh', 
      scale: 0, 
      duration: 1.5, 
      ease: 'back.out(1.7)',
      force3D: true
    }, 0);
    
    tl.from(this.box2.nativeElement, { 
      y: '40vh', 
      scale: 0, 
      duration: 1.5, 
      ease: 'back.out(1.7)',
      force3D: true
    }, 0.2);
    
    tl.from(this.box3.nativeElement, { 
      x: '-40vw', 
      scale: 0, 
      duration: 1.5, 
      ease: 'back.out(1.7)',
      force3D: true
    }, 0.4);
    
    tl.from(this.box4.nativeElement, { 
      x: '40vw', 
      scale: 0, 
      duration: 1.5, 
      ease: 'back.out(1.7)',
      force3D: true
    }, 0.6);

    tl.to(this.letterA.nativeElement, { 
      x: 0, 
      opacity: 1, 
      duration: 0.6, 
      ease: 'power2.out',
      force3D: true
    }, '+=0.3');
    
    tl.to(this.letterV.nativeElement, { 
      x: 0, 
      opacity: 1, 
      duration: 0.6, 
      ease: 'power2.out',
      force3D: true
    }, '<');
    
    tl.fromTo(this.name.nativeElement, 
      { opacity: 0, y: 20 }, 
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        ease: 'power2.out',
        force3D: true
      }, '+=0.3');
    
    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      const img = box.nativeElement.querySelector('img');
      if (img) {
        tl.to(img, { 
          filter: 'grayscale(0%)', 
          duration: 1, 
          ease: 'power2.out',
          force3D: true
        }, '-=0.5');
      }
    });

    tl.addLabel('fadeOutStart');
    
    tl.to(this.circleGroup.nativeElement, { 
      opacity: 0, 
      duration: 0.3, 
      ease: 'power2.out',
      force3D: true
    }, 'fadeOutStart');
    
    tl.to(this.screen.nativeElement, { 
      backgroundColor: '#000', 
      duration: 1, 
      ease: 'power2.out'
    }, 'fadeOutStart');
    
    tl.to(this.name.nativeElement, { 
      color: '#ffffff', 
      duration: 1, 
      ease: 'power2.out'
    }, 'fadeOutStart');

    tl.call(() => {
      this.unblockScrollAndInteraction();
    }, undefined, 'fadeOutStart+=0.5');

    tl.to(this.screen.nativeElement, { 
      y: '-100%', 
      duration: 0.5, 
      ease: 'power2.inOut',
      force3D: true,
      onComplete: () => {
        this.cleanupWillChange();
      }
    }, 'fadeOutStart+=1');
  }

  private cleanupWillChange(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) return;

    const elements = [
      ...Array.from(document.querySelectorAll('[style*="will-change"]')),
      this.screen.nativeElement,
      this.circleGroup.nativeElement,
      this.letterA.nativeElement,
      this.letterV.nativeElement,
      this.name.nativeElement
    ];

    elements.forEach((el: any) => {
      if (el && el.style) {
        el.style.willChange = 'auto';
      }
    });

    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      const img = box.nativeElement.querySelector('img');
      if (img) {
        img.style.willChange = 'auto';
      }
    });
  }

  private blockScrollAndInteraction(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (this.isScrollBlocked) return;
    
    this.isScrollBlocked = true;
    
    // Verificar que document.body existe antes de usarlo
    if (typeof document !== 'undefined' && document.body) {
      this.renderer.addClass(document.body, 'reserve-scrollbar-space');
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    }
    
    this.wheelListener = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    
    this.touchMoveListener = (event: TouchEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
    
    this.keydownListener = (event: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (keys.includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('wheel', this.wheelListener, { passive: false, capture: true });
    document.addEventListener('touchmove', this.touchMoveListener, { passive: false, capture: true });
    document.addEventListener('keydown', this.keydownListener, { passive: false, capture: true });
  }

  private unblockScrollAndInteraction(): void {
    if (!this.isScrollBlocked) return;
    
    this.isScrollBlocked = false;
    
    // Verificar que document.body existe antes de usarlo
    if (typeof document !== 'undefined' && document.body) {
      this.renderer.removeClass(document.body, 'reserve-scrollbar-space');
      this.renderer.removeStyle(document.body, 'overflow');
    }
    
    if (this.wheelListener) {
      document.removeEventListener('wheel', this.wheelListener, { capture: true } as any);
      this.wheelListener = undefined;
    }
    if (this.touchMoveListener) {
      document.removeEventListener('touchmove', this.touchMoveListener, { capture: true } as any);
      this.touchMoveListener = undefined;
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener, { capture: true } as any);
      this.keydownListener = undefined;
    }
  }

  ngOnDestroy(): void {
    this.unblockScrollAndInteraction();
    
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = undefined;
    }
    
    // Solo limpiar will-change en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.cleanupWillChange();
    }
  }
}