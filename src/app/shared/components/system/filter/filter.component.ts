import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ElementRef, ViewChildren, QueryList, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { gsap } from 'gsap';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css'],
  changeDetection: ChangeDetectionStrategy.Default})
export class FilterComponent implements AfterViewInit, OnChanges {
  @Input() isMobileView: boolean = false;
  @Input() showFilters: boolean = false;
  @Output() showFiltersChange = new EventEmitter<boolean>();

  @Input() activeCategory: string = 'new-drop';
  @Output() activeCategoryChange = new EventEmitter<string>();

  @Input() selectedCollectionId: string | null = null;
  @Output() selectedCollectionIdChange = new EventEmitter<string | null>();

  @Input() topCollections: any[] = [];
  @Input() topBridesCollections: any[] = [];

  @Output() filterApplied = new EventEmitter<void>();

  @ViewChildren('indicator') indicators!: QueryList<ElementRef<HTMLElement>>;

  options = [
    { label: 'New Drop', value: 'new-drop' },
    { label: 'Novias', value: 'novias' },
    { label: 'Sastrería', value: 'sastreria' },
    { label: 'Camperas', value: 'camperas' },
    { label: 'Accesorios', value: 'accesorios' },
    { label: 'Pantalones y Faldas', value: 'pantalones-y-faldas' },
    { label: 'Tops', value: 'tops' },
    { label: 'Buzos', value: 'buzos' },
    { label: 'Vestidos y Monos', value: 'vestidos-y-monos' }];

  ngAfterViewInit(): void {
    this.animateIndicators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeCategory'] && !changes['activeCategory'].firstChange) {
      setTimeout(() => this.animateIndicators(), 0);
    }
  }

  selectCategory(value: string): void {
    if (this.activeCategory === value && value !== 'novias') {
      if (this.isMobileView) {
        this.toggleFilters();
      }
      return;
    }
    this.activeCategory = value;
    this.activeCategoryChange.emit(value);
    
    this.selectedCollectionId = null;
    this.selectedCollectionIdChange.emit(null);
    
    this.filterApplied.emit();
    this.animateIndicators();

    if (this.isMobileView) {
      this.toggleFilters();
    }
  }

  selectCollection(id: string | null): void {
    this.selectedCollectionId = this.selectedCollectionId === id ? null : id;
    this.selectedCollectionIdChange.emit(this.selectedCollectionId);
    this.filterApplied.emit();

    if (this.isMobileView) {
      this.toggleFilters();
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.showFiltersChange.emit(this.showFilters);
  }

  onOverlayClick(event: MouseEvent): void {
    this.toggleFilters();
  }

  private animateIndicators(): void {
    if (!this.indicators) return;

    this.indicators.forEach((indicator) => {
      const el = indicator.nativeElement;
      const val = el.getAttribute('data-value');
      
      if (val === this.activeCategory) {
        gsap.to(el, {
          scaleY: 1,
          opacity: 1,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      } else {
        gsap.to(el, {
          scaleY: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          overwrite: 'auto'
        });
      }
    });
  }
}
