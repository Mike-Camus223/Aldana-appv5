import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  PLATFORM_ID,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { Collection } from '../../../../../shared/models/collection.model';
import { AppMenuItem } from '../../../../../shared/models/app-menu-item.model';
import { CollectionBridesService } from '../../../services/brides-collections.service';
import { BreadcrumbComponent } from "../../../../../shared/layouts/components/breadcrumb/breadcrump.component";
import { CardInitAnimationDirective } from '../../../../../shared/directives/animations/card-init-animation.directive';
import { WordRevealDirective } from '../../../../../shared/directives/animations/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../../../shared/directives/animations/fadeupletter.directive';

@Component({
  selector: 'app-novias',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    CardInitAnimationDirective,
    WordRevealDirective,
    FadeUpLetterDirective
  ],
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
  templateUrl: './novias.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './novias.component.css'
})
export class NoviasComponent implements OnInit, AfterViewInit, OnDestroy {
  breadcrumbItemsNovias: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' }
  ];

  CollectionBrides: Collection[] = [];
  productColumns: number = 4;
  private userChoice: number | null = null;
  private userChoiceBreakpoint: 'lg' | 'xl' | null = null;
  private readonly BP_SM = 640;
  private readonly BP_LG = 1024;
  private readonly BP_XL = 1280;

  private platformId = inject(PLATFORM_ID);
  private collectionService = inject(CollectionBridesService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    try {
      const result = await this.collectionService.getCollectionBrides();
      this.CollectionBrides = result ?? [];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al obtener colecciones de novias:', error);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyColumnsForWidth(window.innerWidth);
    }
  }

  ngOnDestroy() {}

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    if (isPlatformBrowser(this.platformId)) {
      this.applyColumnsForWidth((event.target as Window).innerWidth);
    }
  }

  private applyColumnsForWidth(width: number): void {
    let newCols: number;
    const currentBreakpoint = this.getCurrentBreakpoint(width);

    if (width < this.BP_SM) {
      newCols = 1;
      this.resetUserPreference();
    } else if (width < this.BP_LG) {
      newCols = 2;
      this.resetUserPreference();
    } else if (width < this.BP_XL) {
      if (this.userChoice !== null && this.userChoiceBreakpoint === 'lg') {
        newCols = Math.min(this.userChoice, 3);
      } else {
        if (this.userChoiceBreakpoint === 'xl') {
          this.resetUserPreference();
        }
        newCols = 3;
        this.userChoiceBreakpoint = 'lg';
      }
    } else {
      if (this.userChoice !== null && this.userChoiceBreakpoint === 'xl') {
        newCols = Math.min(Math.max(this.userChoice, 2), 4);
      } else {
        if (this.userChoiceBreakpoint !== 'xl') {
          this.resetUserPreference();
        }
        newCols = 4;
        this.userChoiceBreakpoint = 'xl';
      }
    }

    if (this.productColumns !== newCols) {
      this.productColumns = newCols;
      this.cdr.detectChanges();
    }
  }

  private getCurrentBreakpoint(width: number): 'mobile' | 'sm' | 'lg' | 'xl' {
    if (width < this.BP_SM) return 'mobile';
    if (width < this.BP_LG) return 'sm';
    if (width < this.BP_XL) return 'lg';
    return 'xl';
  }

  private resetUserPreference(): void {
    this.userChoice = null;
    this.userChoiceBreakpoint = null;
  }

  setProductColumns(cols: number): void {
    if (cols >= 2 && cols <= 4) {
      const currentWidth = window.innerWidth;
      const currentBreakpoint = this.getCurrentBreakpoint(currentWidth);
      
      if (currentBreakpoint === 'lg' || currentBreakpoint === 'xl') {
        this.userChoice = cols;
        this.userChoiceBreakpoint = currentBreakpoint;
        this.productColumns = cols;
        this.cdr.detectChanges();
      }
    }
  }

  goToCollection(slug: string) {
    this.router.navigate(['/novias-colecciones', slug]);
  }
}
