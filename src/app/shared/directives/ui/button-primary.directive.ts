import { Directive, ElementRef, Renderer2, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[smartButton]'
})
export class ButtonPrimaryDirective implements OnChanges, AfterViewInit {

  @Input() loadingAsync: boolean = false;
  @Input() icon: boolean = false;
  @Input() iconFont: string | null = null;   
  @Input() iconSvg: string | null = null;    
  @Input() iconStyle: string = '';         
  private iconElement: HTMLElement | null = null;
  private loadingElement: HTMLElement | null = null;
  private originalContentHTML: string = ''; // Guardar HTML original
  private viewInitialized: boolean = false;

  constructor(private el: ElementRef, private renderer: Renderer2) { 
    this.applyBaseStyles();
  }

  ngAfterViewInit(): void {
    // Guardar el contenido original DESPUÉS de que Angular renderice todo
    this.viewInitialized = true;
    this.handleIcons();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loadingAsync'] && this.viewInitialized) {
      this.toggleLoading();
    }

    if ((changes['icon'] || changes['iconFont'] || changes['iconSvg']) && this.viewInitialized) {
      this.handleIcons();
    }
  }

  // --------------------------------------
  // ESTILOS BASE DEL BOTÓN
  // --------------------------------------
  private applyBaseStyles(): void {
    const classes = [
      'bg-aldy-medium',
      'cursor-pointer',
      'text-white',
      'NewAldyFontType4',
      'text-sm',
      'tracking-wider',
      'hover:bg-aldy-medium-2',
      'transition-colors',
      'duration-500',
      'ease-in-out',
      'flex',
      'items-center',
      'justify-center',
      'gap-2',
      'h-10'
    ];

    classes.forEach(cls => this.renderer.addClass(this.el.nativeElement, cls));
  }

  // --------------------------------------
  // MANEJO DE LOADING
  // --------------------------------------
  private toggleLoading(): void {
    if (this.loadingAsync) {
      this.showLoadingDots();
      this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
    } else {
      this.removeLoadingDots();
      this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
    }
  }
  
  private showLoadingDots(): void {
    const host = this.el.nativeElement;
    
    // Guardar el HTML completo actual ANTES de limpiarlo
    if (!this.originalContentHTML) {
      this.originalContentHTML = host.innerHTML;
    }
    
    // Limpiar TODO el contenido del botón
    host.innerHTML = '';

    // Crear elemento de loading
    this.loadingElement = this.renderer.createElement('span');
    this.renderer.addClass(this.loadingElement, 'loading-dots');

    // ANIMACION LOADING DEL BOTON
    this.renderer.setProperty(
      this.loadingElement,
      'innerHTML',
      `
      <div class="h-10 items-center justify-center flex gap-1"> 
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      `
    );

    // Estilos CSS insertados dinámicamente (solo una vez)
    if (!document.getElementById('loading-dots-styles')) {
      const style = document.createElement('style');
      style.id = 'loading-dots-styles';
      style.innerHTML = `
        .loading-dots {
          display: flex;
          gap: 4px;
        }
        .loading-dots .dot {
          width: 5px;
          height: 5px;
          background: white;
          border-radius: 50%;
          animation: bounce 0.8s infinite alternate;
        }
        .loading-dots .dot:nth-child(2) { animation-delay: 0.15s; }
        .loading-dots .dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes bounce {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.3); opacity: 0.4; }
        }
      `;
      document.head.appendChild(style);
    }

    // Agregar solo el loading al botón
    this.renderer.appendChild(host, this.loadingElement);
  }

  private removeLoadingDots(): void {
    const host = this.el.nativeElement;
    
    if (this.loadingElement) {
      this.renderer.removeChild(host, this.loadingElement);
      this.loadingElement = null;
    }

    // Restaurar el contenido original completo
    if (this.originalContentHTML) {
      host.innerHTML = this.originalContentHTML;
    }
  }

  // --------------------------------------
  // MANEJO DE ICONOS
  // --------------------------------------
  private handleIcons(): void {
    // No agregar iconos si está en loading
    if (this.loadingAsync) return;

    // limpiar iconos previos
    if (this.iconElement) {
      this.renderer.removeChild(this.el.nativeElement, this.iconElement);
      this.iconElement = null;
    }

    if (!this.icon) return;

    // evitar que ambos iconos estén activos
    if (this.iconFont && this.iconSvg) {
      console.warn('Solo puede estar activo iconFont O iconSvg, no ambos.');
      return;
    }

    // Crear elemento base
    this.iconElement = this.renderer.createElement('span');
    this.renderer.setAttribute(this.iconElement, 'class', this.iconStyle);

    // Font Awesome
    if (this.iconFont) {
      const i = this.renderer.createElement('i');
      this.iconFont.split(' ').forEach(cls => this.renderer.addClass(i, cls));
      this.renderer.appendChild(this.iconElement, i);
    }

    // SVG local
    if (this.iconSvg) {
      const img = this.renderer.createElement('img');
      this.renderer.setAttribute(img, 'src', this.iconSvg);
      this.renderer.setAttribute(img, 'class', this.iconStyle);
      this.renderer.appendChild(this.iconElement, img);
    }

    // Insertar al inicio del botón
    const host = this.el.nativeElement;
    this.renderer.insertBefore(host, this.iconElement, host.firstChild);
    
    // Actualizar el contenido original guardado con el nuevo ícono
    this.originalContentHTML = host.innerHTML;
  }
}