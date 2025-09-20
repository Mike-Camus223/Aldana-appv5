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
  private dimensionsCalculated = false;
  private originalDimensions = { width: 0, height: 0 };

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // En lugar de ocultar completamente, usamos opacity para mantener el espacio
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    // Aseguramos que el elemento mantenga su espacio en el layout
    this.renderer.setStyle(this.el.nativeElement, 'visibility', 'visible');
  }

  ngAfterViewInit(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR, mostrar el contenido directamente sin animación
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      return;
    }
    
    this.originalContent = this.el.nativeElement.innerHTML || this.el.nativeElement.textContent || '';
    
    // Calculamos las dimensiones originales inmediatamente
    this.calculateAndReserveDimensions();
    
    this.loaderService.currentLoader$
      .pipe(takeUntil(this.destroy$))
      .subscribe((currentLoader) => {
        if (currentLoader === null) {
          this.loaderService.animationsEnabled$
            .pipe(takeUntil(this.destroy$))
            .subscribe((enabled: boolean) => {
              if (enabled && !this.animationSetup) {
                // Pequeño delay para asegurar que el layout esté estable
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

  private calculateAndReserveDimensions(): void {
    if (this.dimensionsCalculated) return;

    // Solo calcular dimensiones en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      // En SSR, usar dimensiones por defecto
      this.originalDimensions.width = 0;
      this.originalDimensions.height = 0;
      this.dimensionsCalculated = true;
      return;
    }

    const nativeElement = this.el.nativeElement;
    
    // Temporalmente hacemos visible el elemento para medir sus dimensiones reales
    this.renderer.setStyle(nativeElement, 'opacity', '1');
    this.renderer.setStyle(nativeElement, 'position', 'static');
    
    // Forzamos un reflow para obtener dimensiones precisas
    nativeElement.offsetHeight;
    
    const rect = nativeElement.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(nativeElement);
    
    this.originalDimensions.width = rect.width;
    this.originalDimensions.height = rect.height;
    
    // Reservamos el espacio exacto que ocupará el elemento
    if (this.originalDimensions.height > 0) {
      this.renderer.setStyle(nativeElement, 'min-height', `${this.originalDimensions.height}px`);
    }
    
    // Si el elemento tiene un ancho específico, lo preservamos
    if (this.originalDimensions.width > 0 && computedStyle.width !== 'auto') {
      this.renderer.setStyle(nativeElement, 'min-width', `${this.originalDimensions.width}px`);
    }
    
    // Volvemos a ocultar el elemento
    this.renderer.setStyle(nativeElement, 'opacity', '0');
    
    this.dimensionsCalculated = true;
  }

  private resetAnimation(): void {
    this.animationSetup = false;
    if (this.animationTween) {
      this.animationTween.kill();
      this.animationTween = null;
    }
    
    // Mantenemos las dimensiones reservadas pero ocultamos el contenido
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
  }

  private setupAnimation(): void {
    if (this.animationSetup) return;
    this.animationSetup = true;

    // Solo ejecutar animaciones en el navegador
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

        // Recalculamos dimensiones si es necesario (después de loaders)
        if (!this.dimensionsCalculated) {
          this.calculateAndReserveDimensions();
        }
        
        if (nativeElement.innerHTML && nativeElement.innerHTML.includes('<span')) {
          this.setupAnimationWithHTML();
        } else {
          this.setupAnimationWithText();
        }
        
        // Refresh ScrollTrigger después de que todo esté configurado
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }

      } catch (error) {
        console.error('Error setting up word reveal animation:', error);
        this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
      }
    });
  }

  private setupAnimationWithHTML(): void {
    const nativeElement = this.el.nativeElement;
    const wrapper = this.renderer.createElement('div');
    
    // Configuramos el wrapper para mantener las dimensiones
    this.renderer.setStyle(wrapper, 'display', 'block');
    this.renderer.setStyle(wrapper, 'overflow', 'hidden');
    this.renderer.setStyle(wrapper, 'width', '100%');
    this.renderer.setStyle(wrapper, 'min-height', `${this.originalDimensions.height}px`);

    const tempDiv = this.renderer.createElement('div');
    tempDiv.innerHTML = this.originalContent;
    
    const childNodes = Array.from(tempDiv.childNodes);
    
    childNodes.forEach((node: any) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        const words = text.split(/(\s+)/);
        
        words.forEach((word: string) => {
          if (word.trim()) {
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
          } else if (word) {
            const spaceSpan = this.renderer.createElement('span');
            spaceSpan.textContent = word;
            this.renderer.appendChild(wrapper, spaceSpan);
          }
        });
      } else {
        const clonedNode = node.cloneNode(true);
        this.renderer.appendChild(wrapper, clonedNode);
      }
    });

    // Limpiamos y agregamos el nuevo contenido
    nativeElement.innerHTML = '';
    this.renderer.appendChild(nativeElement, wrapper);

    const allWordSpans = nativeElement.querySelectorAll('span > span');

    if (allWordSpans.length > 0) {
      this.animationTween = gsap.to(allWordSpans, {
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
            this.renderer.setStyle(nativeElement, 'opacity', '1');
          },
        },
        onComplete: () => {
          // Limpiamos will-change después de la animación
          allWordSpans.forEach((span: any) => {
            span.style.willChange = 'auto';
          });
        }
      });
    } else {
      this.renderer.setStyle(nativeElement, 'opacity', '1');
    }
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
    this.renderer.setStyle(wrapper, 'min-height', `${this.originalDimensions.height}px`);

    const words = text.split(/(\s+)/);
    
    words.forEach((word: string) => {
      if (word.trim()) {
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
      } else if (word) {
        const spaceSpan = this.renderer.createElement('span');
        spaceSpan.textContent = word;
        this.renderer.appendChild(wrapper, spaceSpan);
      }
    });

    this.renderer.appendChild(nativeElement, wrapper);

    const allWordSpans = nativeElement.querySelectorAll('span > span');

    if (allWordSpans.length > 0) {
      this.animationTween = gsap.to(allWordSpans, {
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
            this.renderer.setStyle(nativeElement, 'opacity', '1');
          },
        },
        onComplete: () => {
          // Limpiamos will-change después de la animación
          allWordSpans.forEach((span: any) => {
            span.style.willChange = 'auto';
          });
        }
      });
    } else {
      this.renderer.setStyle(nativeElement, 'opacity', '1');
    }
  }

  ngOnDestroy(): void {
    if (this.animationTween) {
      this.animationTween.kill();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}