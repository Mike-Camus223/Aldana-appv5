import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnDestroy,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Collection } from '../../../utils/models/collection.model';
import { RouterModule, Router } from '@angular/router';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from "../../../utils/directives/fadeupletter.directive";

@Component({
  selector: 'app-novias-template',
  standalone: true,
  imports: [CommonModule, RouterModule, CardInitAnimationDirective, WordRevealDirective, FadeUpLetterDirective],
  animations: [
    trigger('gridAnimation', [
      transition('* => *', [
        style({ transform: 'scale(0.98)', opacity: 0.8 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      state('true', style({ transform: 'translateX(0)' })),
      state('false', style({ transform: 'translateX(-100%)' })),
      transition('false => true', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition('true => false', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ],
  templateUrl: './novias-template.component.html',
  styleUrls: ['./novias-template.component.css'],
})
export class NoviasTemplateComponent implements AfterViewInit, OnDestroy {
  CollectionBrides: Collection[] = [];
  productColumns: number = 4;

  // Guarda la elección MANUAL del usuario y en qué breakpoint la hizo
  private userChoice: number | null = null;
  private userChoiceBreakpoint: 'lg' | 'xl' | null = null;

  // Breakpoints Tailwind
  private readonly BP_SM = 640;
  private readonly BP_LG = 1024;
  private readonly BP_XL = 1280;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private CollectionService: CollectionBridesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngAfterViewInit() {
    try {
      const result = await this.CollectionService.getCollectionBrides();
      this.CollectionBrides = result ?? [];
    } catch (error) {
      console.error('Error al obtener colecciones:', error);
    }

    if (isPlatformBrowser(this.platformId)) {
      this.applyColumnsForWidth(window.innerWidth);

      const { Fancybox } = await import('@fancyapps/ui');
      Fancybox.bind("[data-fancybox='gallery']", {
        Thumbs: true,
        Toolbar: {
          display: {
            left: [],
            middle: [],
            right: ['toggleZoom', 'slideshow', 'fullscreen', 'thumbs', 'close']
          }
        }
      });
    }
  }

  ngOnDestroy() {}

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      this.applyColumnsForWidth((event.target as Window).innerWidth);
    }
  }

  /**
   * Lógica de columnas por breakpoint con reseteo automático
   * 
   * < sm  (< 640)    → 1 col  (resetea cualquier preferencia)
   * sm–lg (640–1023) → 2 cols (resetea cualquier preferencia)
   * lg–xl (1024–1279)→ 3 cols (resetea preferencias de xl, mantiene de lg)
   * xl+   (≥ 1280)   → 4 cols (resetea preferencias de lg, mantiene de xl)
   */
  private applyColumnsForWidth(width: number): void {
    let newCols: number;
    const currentBreakpoint = this.getCurrentBreakpoint(width);

    if (width < this.BP_SM) {
      // Mobile: siempre 1, resetea cualquier preferencia
      newCols = 1;
      this.resetUserPreference();
      
    } else if (width < this.BP_LG) {
      // sm–lg: siempre 2, resetea cualquier preferencia
      newCols = 2;
      this.resetUserPreference();
      
    } else if (width < this.BP_XL) {
      // lg–xl: máximo 3
      // Si el usuario eligió manualmente ESTANDO EN LG, respetar
      // Si venía de xl (breakpoint superior), resetear y usar automático
      if (this.userChoice !== null && this.userChoiceBreakpoint === 'lg') {
        newCols = Math.min(this.userChoice, 3);
      } else {
        // Resetear preferencia si venía de otro breakpoint
        if (this.userChoiceBreakpoint === 'xl') {
          this.resetUserPreference();
        }
        newCols = 3; // automático
        // Actualizar que ahora estamos en breakpoint lg
        this.userChoiceBreakpoint = 'lg';
      }
      
    } else {
      // xl+: máximo 4
      // Si el usuario eligió manualmente ESTANDO EN XL, respetar
      // Si venía de lg o inferior, resetear y usar automático
      if (this.userChoice !== null && this.userChoiceBreakpoint === 'xl') {
        newCols = Math.min(Math.max(this.userChoice, 2), 4);
      } else {
        // Resetear preferencia si venía de otro breakpoint
        if (this.userChoiceBreakpoint !== 'xl') {
          this.resetUserPreference();
        }
        newCols = 4; // automático
        // Actualizar que ahora estamos en breakpoint xl
        this.userChoiceBreakpoint = 'xl';
      }
    }

    if (this.productColumns !== newCols) {
      this.productColumns = newCols;
      this.cdr.detectChanges();
    }
  }

  /**
   * Obtiene el breakpoint actual basado en el ancho
   */
  private getCurrentBreakpoint(width: number): 'mobile' | 'sm' | 'lg' | 'xl' {
    if (width < this.BP_SM) return 'mobile';
    if (width < this.BP_LG) return 'sm';
    if (width < this.BP_XL) return 'lg';
    return 'xl';
  }

  /**
   * Resetea la preferencia del usuario
   */
  private resetUserPreference(): void {
    this.userChoice = null;
    this.userChoiceBreakpoint = null;
  }

  setProductColumns(cols: number): void {
    if (cols >= 2 && cols <= 4) {
      const currentWidth = window.innerWidth;
      const currentBreakpoint = this.getCurrentBreakpoint(currentWidth);
      
      // Solo permitir selección manual si estamos en los breakpoints que soportan topbar
      if (currentBreakpoint === 'lg' || currentBreakpoint === 'xl') {
        this.userChoice = cols;
        this.userChoiceBreakpoint = currentBreakpoint;
        this.productColumns = cols;
      }
    }
  }

  goToCollection(slug: string) {
    this.router.navigate(['/novias-colecciones', slug]);
  }
}