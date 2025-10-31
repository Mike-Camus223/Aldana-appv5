import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, OnDestroy, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { gsap } from 'gsap';
import { LoaderService } from '../../../../core/services/utils/loader.service';

@Component({
  standalone: true,
  selector: 'app-loading-screen',
  imports: [NgOptimizedImage],
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
  @ViewChild('logoContainer') logoContainer!: ElementRef;
  @ViewChild('logoSvg') logoSvg!: ElementRef;
  @ViewChild('nameContainer') nameContainer!: ElementRef;
  @ViewChild('vilcabanaSvg') vilcabanaSvg!: ElementRef;
  @ViewChild('aldanaSvg') aldanasvg!: ElementRef;

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
      // Configurar estados iniciales inmediatamente
      this.setupInitialStates();
      
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        this.initializeAnimation();
      }, 100);
    }
  }

  private setupInitialStates(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Ocultar todo inmediatamente con CSS nativo
    const elements = [
      this.box1?.nativeElement,
      this.box2?.nativeElement,
      this.box3?.nativeElement,
      this.box4?.nativeElement,
      this.logoSvg?.nativeElement,
      this.nameContainer?.nativeElement
    ].filter(el => el);

    elements.forEach(el => {
      this.renderer.setStyle(el, 'opacity', '0');
      this.renderer.setStyle(el, 'visibility', 'hidden');
    });

    // Configurar grayscale inicial en las imágenes
    this.setupImagePreloading();
  }

  private setupImagePreloading(): void {
    const boxes = [this.box1, this.box2, this.box3, this.box4];
    
    boxes.forEach(box => {
      if (box?.nativeElement) {
        const img = box.nativeElement.querySelector('img');
        if (img) {
          // Forzar carga eager
          img.loading = 'eager';
          img.fetchPriority = 'high';
          
          // Aplicar grayscale inicial inmediatamente
          this.renderer.setStyle(img, 'filter', 'grayscale(100%)');
          
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

    // Esperar a que las imágenes carguen o timeout
    const startAnimation = () => {
      this.blockScrollAndInteraction();
      this.optimizePerformance();
      this.createAnimationSequence();
    };

    if (this.imagesLoaded >= this.totalImages) {
      startAnimation();
    } else {
      // Timeout de seguridad
      const timeoutId = setTimeout(() => {
        startAnimation();
      }, 2000);

      // También iniciar si todas las imágenes cargan antes
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

    // Mostrar elementos antes de animar
    const allElements = [
      this.screen.nativeElement,
      this.circleGroup.nativeElement,
      this.box1.nativeElement, this.box2.nativeElement, 
      this.box3.nativeElement, this.box4.nativeElement,
      this.logoSvg.nativeElement,
      this.nameContainer.nativeElement
    ];

    allElements.forEach(el => {
      this.renderer.setStyle(el, 'visibility', 'visible');
      el.style.transform = 'translateZ(0)';
      el.style.backfaceVisibility = 'hidden';
      el.style.perspective = '1000px';
    });

    // Forzar layout sync
    this.screen.nativeElement.offsetHeight;
  }

  private createAnimationSequence(): void {
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.hideAndComplete();
      }
    });

    // Activar animación SVG cuando el timeline comience
    this.timeline.eventCallback('onStart', () => {
      // El logo SVG se activará después de su animación de escala
    });

    // Configurar estados iniciales para GSAP (MANTENIENDO GRAYSCALE)
    const boxes = [this.box1, this.box2, this.box3, this.box4];
    
    gsap.set(boxes.map(b => b.nativeElement), { 
      scale: 0,
      rotation: 0,
      opacity: 0,
      force3D: true
    });

    // MANTENER el grayscale en las imágenes
    boxes.forEach(box => {
      const img = box.nativeElement.querySelector('img');
      if (img) {
        gsap.set(img, { 
          filter: 'grayscale(100%)',
          force3D: true,
          willChange: "filter"
        });
      }
    });

    gsap.set(this.logoSvg.nativeElement, { 
      scale: 0,
      opacity: 0,
      force3D: true
    });

    gsap.set(this.nameContainer.nativeElement, { 
      opacity: 0, 
      y: 20,
      force3D: true
    });

    // Animación secuencial de boxes (CON ROTACIÓN INICIAL COMO TENÍAS)
    this.timeline.fromTo(this.box1.nativeElement, 
      { 
        scale: 0,
        rotation: -5,
        opacity: 0
      },
      { 
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.1, 
        ease: "back.out(1.4)",
        force3D: true
      }, 0);

    this.timeline.fromTo(this.box2.nativeElement, 
      { 
        scale: 0,
        rotation: 3,
        opacity: 0
      },
      { 
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.1, 
        ease: "back.out(1.6)",
        force3D: true
      }, 0.15);

    this.timeline.fromTo(this.box3.nativeElement, 
      { 
        scale: 0,
        rotation: -4,
        opacity: 0
      },
      { 
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.1, 
        ease: "back.out(1.5)",
        force3D: true
      }, 0.3);

    this.timeline.fromTo(this.box4.nativeElement, 
      { 
        scale: 0,
        rotation: 4,
        opacity: 0
      },
      { 
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 1.1, 
        ease: "back.out(1.7)",
        force3D: true
      }, 0.45);

    // Logo SVG con animación
    this.timeline.to(this.logoSvg.nativeElement, { 
      scale: 1,
      opacity: 1, 
      duration: 0.7, 
      ease: 'back.out(1.8)',
      onComplete: () => {
        // Activar la animación SVG después de la escala
        this.logoSvg.nativeElement.classList.add('active');
      }
    }, '+=0.1');
    
    // Nombre (Aldana y Vilcabana SVGs)
    this.timeline.to(this.nameContainer.nativeElement, { 
      opacity: 1, 
      y: 0, 
      duration: 0.8, 
      ease: 'power2.out'
    }, '-=0.2');
    
    // COLORIZACIÓN - MANTENIENDO LA ANIMACIÓN DE GRAYSCALE A COLOR
    this.timeline.to([this.box1, this.box2, this.box3, this.box4].map(box => 
      box.nativeElement.querySelector('img')), { 
        filter: 'grayscale(0%)', 
        duration: 1, 
        ease: 'power2.out',
        force3D: true,
        stagger: 0.1
      }, '-=0.3');

    // Salida
    this.timeline.to(this.circleGroup.nativeElement, { 
      opacity: 0, 
      duration: 0.4, 
      ease: 'power2.out'
    }, '+=0.5');
    
    // ---- CAMBIO CRÍTICO: activamos el scroll y ponemos SVGs en blanco EN EL MOMENTO
    // ---- en que comienza la transición a fondo negro (onStart).
    this.timeline.to(this.screen.nativeElement, { 
      backgroundColor: '#000', 
      duration: 0.8, 
      ease: 'power2.out',
      onStart: () => {
        // Activar scrollbar justo cuando la pantalla empieza a ponerse negra
        this.unblockScrollAndInteraction();

        // Convertir los SVGs del nombre a blanco (fill y stroke)
        if (this.nameContainer && this.nameContainer.nativeElement) {
          const svgElements = this.nameContainer.nativeElement.querySelectorAll('path, text, polygon, rect, circle, tspan, line, polyline, g');
          svgElements.forEach((el: Element) => {
            try {
              this.renderer.setStyle(el, 'fill', '#ffffff');
              this.renderer.setStyle(el, 'stroke', '#ffffff');
            } catch (e) {
              // no hacer nada si algún elemento no acepta estilos directos
            }
          });
        }

        // También asegurar que el vilcabanaSvg (si existe) se ponga blanco
        if (this.vilcabanaSvg && this.vilcabanaSvg.nativeElement) {
          try {
            const nodes = this.vilcabanaSvg.nativeElement.querySelectorAll('*');
            nodes.forEach((n: Element) => {
              this.renderer.setStyle(n, 'fill', '#ffffff');
              this.renderer.setStyle(n, 'stroke', '#ffffff');
            });
          } catch (e) { /* ignore */ }
        }
      }
    }, '-=0.4');

    this.timeline.to(this.logoSvg.nativeElement, { 
      filter: 'brightness(0) invert(1)', // Convertir logo principal a blanco
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.7');

    this.timeline.to(this.vilcabanaSvg.nativeElement, { 
      filter: 'brightness(0) invert(1)', // Convertir logo principal a blanco
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.7');

    this.timeline.to(this.aldanasvg.nativeElement, { 
      filter: 'brightness(0) invert(1)', // Convertir logo principal a blanco
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.7');

    this.timeline.to(this.screen.nativeElement, { 
      y: '-100%', 
      duration: 0.6, 
      ease: 'power2.inOut',
      onComplete: () => {
        this.cleanupWillChange();
      }
    }, '-=0.3');
  }

  private hideAndComplete(): void {
  this.isAnimationComplete = true;
  
  // Activar animaciones INMEDIATAMENTE usando el servicio
  this.loaderService.setAnimationsEnabled(true);
  
  this.unblockScrollAndInteraction();
  
  // Ocultar completamente el componente
  if (this.screen?.nativeElement) {
    this.renderer.setStyle(this.screen.nativeElement, 'display', 'none');
  }
  
  this.loadingFinished.emit();
  this.loaderService.finish('main');
}

  private cleanupWillChange(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const elements = [
      this.screen?.nativeElement,
      this.circleGroup?.nativeElement,
      this.logoSvg?.nativeElement,
      this.nameContainer?.nativeElement
    ].filter(el => el);

    elements.forEach((el: any) => {
      if (el && el.style) {
        el.style.willChange = 'auto';
        el.style.transform = '';
        el.style.backfaceVisibility = '';
        el.style.perspective = '';
      }
    });

    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      const img = box?.nativeElement?.querySelector('img');
      if (img && img.style) {
        img.style.willChange = 'auto';
        img.style.transform = '';
      }
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
    
    if (this.wheelListener) {
      document.removeEventListener('wheel', this.wheelListener, { capture: true } as any);
    }
    if (this.touchMoveListener) {
      document.removeEventListener('touchmove', this.touchMoveListener, { capture: true } as any);
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener, { capture: true } as any);
    }
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
