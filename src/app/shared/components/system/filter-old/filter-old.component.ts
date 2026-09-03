import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { AldyCheckboxV1Directive } from '../../../directives/ui/aldy-checkbox.directive';
import { Product } from '../../../models/Products-supabase.interface';
import { ProductUtils } from '../../../utils/mappers/product.mapper';

@Component({
  selector: 'app-filter-old',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    AcordiongenericComponent,
    AldyCheckboxV1Directive
  ],
  templateUrl: './filter-old.component.html',
  styleUrls: ['./filter-old.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager})
export class FilterOldComponent implements OnChanges {
  @Input() isMobileView: boolean = false;
  @Input() showFilters: boolean = false;
  @Output() showFiltersChange = new EventEmitter<boolean>();

  @Input() loading: boolean = false;
  @Input() topCollections: any[] = [];
  @Input() topBridesCollections: any[] = [];
  @Input() isBridalView: boolean = false;
  @Input() allowedSizes: string[] = ['S', 'M', 'L'];
  @Input() allProducts: Product[] = [];
  @Input() categories: any[] = [];
  @Input() pretAPorterCategories: any[] = [];
  @Input() noviasCategories: any[] = [];

  // Two-way bindings
  @Input() selectedCategories: string[] = [];
  @Output() selectedCategoriesChange = new EventEmitter<string[]>();

  @Input() selectedSubcategoriesMap: Record<string, string[]> = {};
  @Output() selectedSubcategoriesMapChange = new EventEmitter<Record<string, string[]>>();

  @Input() selectedSizes: string[] = [];
  @Output() selectedSizesChange = new EventEmitter<string[]>();

  @Input() priceMin: number = 0;
  @Output() priceMinChange = new EventEmitter<number>();

  @Input() priceMax: number = 500000;
  @Output() priceMaxChange = new EventEmitter<number>();

  @Input() selectedCollectionId: string | 'general' | null = null;
  @Output() selectedCollectionIdChange = new EventEmitter<string | 'general' | null>();

  @Input() selectedBridesCollectionId: string | 'general' | null = null;
  @Output() selectedBridesCollectionIdChange = new EventEmitter<string | 'general' | null>();

  @Input() activeCategoryScope: string | null = null;
  @Output() activeCategoryScopeChange = new EventEmitter<string | null>();

  @Input() pretAPorterOpen: boolean = false;
  @Output() pretAPorterOpenChange = new EventEmitter<boolean>();

  @Input() noviasOpen: boolean = false;
  @Output() noviasOpenChange = new EventEmitter<boolean>();

  // Actions
  @Output() applyFilters = new EventEmitter<boolean>(); // isMobile
  @Output() clearFiltersAction = new EventEmitter<void>();
  @Output() loadBridesProductsAction = new EventEmitter<void>();

  // Local state
  openAccordions: Set<string> = new Set(['categorias']);
  get openAccordionsArray(): string[] { return Array.from(this.openAccordions); }
  openCollectionDropdowns: Set<string> = new Set();

  private categoriesCache = new Map<string, any[]>();
  private subcategoriesCache = new Map<string, any[]>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allProducts'] || changes['selectedCollectionId'] || changes['selectedBridesCollectionId']) {
      this.clearCaches();
    }
  }

  clearCaches(): void {
    this.categoriesCache.clear();
    this.subcategoriesCache.clear();
  }

  onAccordionToggled(value: string): void {
    const normalized = ProductUtils.normalize(value);
    if (this.openAccordions.has(normalized)) {
      this.openAccordions.delete(normalized);
    } else {
      this.openAccordions.add(normalized);
    }
  }

  togglePretAPorter(): void {
    this.pretAPorterOpen = !this.pretAPorterOpen;
    this.pretAPorterOpenChange.emit(this.pretAPorterOpen);
  }

  toggleNovias(): void {
    this.noviasOpen = !this.noviasOpen;
    this.noviasOpenChange.emit(this.noviasOpen);
    if (this.noviasOpen) {
      this.loadBridesProductsAction.emit();
    }
  }

  toggleCollectionDropdown(id: string): void {
    if (this.openCollectionDropdowns.has(id)) {
      this.openCollectionDropdowns.delete(id);
    } else {
      this.openCollectionDropdowns.add(id);
      if (id.startsWith('bridal-')) {
        this.loadBridesProductsAction.emit();
      }
    }
  }

  isCollectionDropdownOpen(id: string): boolean {
    return this.openCollectionDropdowns.has(id);
  }

  getCategoriesForCollection(type: 'normal' | 'bridal', id: string | 'general' | null): { label: string, value: string }[] {
    const cacheKey = `${type}-${id}`;
    if (this.categoriesCache.has(cacheKey)) {
      return this.categoriesCache.get(cacheKey)!;
    }

    if (id === 'general') {
      const categoryMap = new Map<string, string>();
      this.allProducts.forEach(p => {
        const isBridal = this.isBridalProduct(p);
        const hasCollection = Array.isArray(p?.collections) && p.collections.length > 0;

        if (type === 'normal') {
          if (isBridal || hasCollection) return;
        } else {
          if (!isBridal || hasCollection) return;
        }

        const catName = typeof p.category === 'string' ? p.category : p.category?.name;
        if (catName) {
          categoryMap.set(ProductUtils.normalize(catName), catName);
        }
      });

      const result = Array.from(categoryMap.entries()).map(([value, label]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value
      }));

      this.categoriesCache.set(cacheKey, result);
      return result;
    }

    const products = this.allProducts.filter(p => {
      const isBridal = this.isBridalProduct(p);
      if (type === 'normal' && isBridal) return false;
      if (type === 'bridal' && !isBridal) return false;
      return p.collections?.some(c => String(c.id) === String(id));
    });

    const categoryMap = new Map<string, string>();
    products.forEach(p => {
      const catName = typeof p.category === 'string' ? p.category : p.category?.name;
      if (catName) {
        categoryMap.set(ProductUtils.normalize(catName), catName);
      }
    });

    const result = Array.from(categoryMap.entries()).map(([value, label]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value
    }));

    this.categoriesCache.set(cacheKey, result);
    return result;
  }

  getSubcategoriesForCollectionCategory(type: 'normal' | 'bridal', id: string | 'general' | null, categoryValue: string): { label: string, value: string }[] {
    const cacheKey = `${type}-${id}-${categoryValue}`;
    if (this.subcategoriesCache.has(cacheKey)) {
      return this.subcategoriesCache.get(cacheKey)!;
    }

    const catNorm = ProductUtils.normalize(categoryValue);

    if (id === 'general') {
      const subcatMap = new Map<string, string>();
      this.allProducts.forEach(p => {
        const isBridal = this.isBridalProduct(p);
        const hasCollection = Array.isArray(p?.collections) && p.collections.length > 0;

        if (type === 'normal') {
          if (isBridal || hasCollection) return;
        } else {
          if (!isBridal || hasCollection) return;
        }

        const pCatNorm = ProductUtils.normalize(
          typeof p.category === 'string' ? p.category : p.category?.name || ''
        );
        if (pCatNorm !== catNorm) return;

        const subName = typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name;
        if (subName) {
          subcatMap.set(ProductUtils.normalize(subName), subName);
        }
      });

      const result = Array.from(subcatMap.entries()).map(([value, label]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value
      }));

      this.subcategoriesCache.set(cacheKey, result);
      return result;
    }

    const products = this.allProducts.filter(p => {
      const isBridal = this.isBridalProduct(p);
      if (type === 'normal' && isBridal) return false;
      if (type === 'bridal' && !isBridal) return false;

      const pCatNorm = ProductUtils.normalize(typeof p.category === 'string' ? p.category : p.category?.name || '');
      if (pCatNorm !== catNorm) return false;

      return p.collections?.some(c => String(c.id) === String(id));
    });

    const subcatMap = new Map<string, string>();
    products.forEach(p => {
      const subName = typeof p.subcategory === 'string' ? p.subcategory : p.subcategory?.name;
      if (subName) {
        subcatMap.set(ProductUtils.normalize(subName), subName);
      }
    });

    const result = Array.from(subcatMap.entries()).map(([value, label]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value
    }));

    this.subcategoriesCache.set(cacheKey, result);
    return result;
  }

  private buildScopeKey(type: 'normal' | 'bridal', id: string | 'general' | null): string {
    return `${type}-${String(id ?? 'none')}`;
  }

  private setActiveScope(type: 'normal' | 'bridal', id: string | 'general' | null): void {
    const nextScope = this.buildScopeKey(type, id);
    if (this.activeCategoryScope && this.activeCategoryScope !== nextScope) {
      this.selectedCategories = [];
      this.selectedCategoriesChange.emit(this.selectedCategories);
      this.selectedSubcategoriesMap = {};
      this.selectedSubcategoriesMapChange.emit(this.selectedSubcategoriesMap);
    }
    this.activeCategoryScope = nextScope;
    this.activeCategoryScopeChange.emit(this.activeCategoryScope);

    if (type === 'normal') {
      this.selectedCollectionId = id;
      this.selectedCollectionIdChange.emit(this.selectedCollectionId);
      this.selectedBridesCollectionId = null;
      this.selectedBridesCollectionIdChange.emit(null);
    } else {
      this.selectedBridesCollectionId = id;
      this.selectedBridesCollectionIdChange.emit(this.selectedBridesCollectionId);
      this.selectedCollectionId = null;
      this.selectedCollectionIdChange.emit(null);
    }
  }

  toggleCategoryInScope(type: 'normal' | 'bridal', id: string | 'general' | null, categoryValue: string): void {
    this.setActiveScope(type, id);
    this.toggleCategory(categoryValue);
  }

  isCategorySelectedInScope(type: 'normal' | 'bridal', id: string | 'general' | null, categoryValue: string): boolean {
    const scope = this.buildScopeKey(type, id);
    if (this.activeCategoryScope !== scope) return false;
    return this.isCategorySelected(categoryValue);
  }

  toggleCategory(categoryValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const idx = this.selectedCategories.indexOf(cat);
    const updated = [...this.selectedCategories];
    const subMap = { ...this.selectedSubcategoriesMap };

    if (idx >= 0) {
      updated.splice(idx, 1);
      delete subMap[cat];
    } else {
      updated.push(cat);
      this.openAccordions.add('subcategorias');
    }
    this.openAccordions.add('categorias');

    this.selectedCategories = updated;
    this.selectedCategoriesChange.emit(updated);
    this.selectedSubcategoriesMap = subMap;
    this.selectedSubcategoriesMapChange.emit(subMap);
  }

  isCategorySelected(categoryValue: string): boolean {
    const cat = ProductUtils.normalize(categoryValue);
    return this.selectedCategories.includes(cat);
  }

  getSubcategoriesForCategory(categoryValue: string): { label: string; value: string }[] {
    const catNorm = ProductUtils.normalize(categoryValue);

    if (this.selectedCollectionId) {
      return this.getSubcategoriesForCollectionCategory('normal', this.selectedCollectionId, categoryValue);
    }
    if (this.selectedBridesCollectionId) {
      return this.getSubcategoriesForCollectionCategory('bridal', this.selectedBridesCollectionId, categoryValue);
    }

    const allStaticCats = [...this.categories, ...this.pretAPorterCategories, ...this.noviasCategories];
    const catObj = allStaticCats.find(c => ProductUtils.normalize(c.value) === catNorm);
    return catObj?.subsections || [];
  }

  toggleSubcategory(categoryValue: string, subValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const sub = ProductUtils.normalize(subValue);
    const subMap = { ...this.selectedSubcategoriesMap };
    const arr = [...(subMap[cat] || [])];
    const idx = arr.indexOf(sub);

    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(sub);
    }

    if (arr.length) {
      subMap[cat] = arr;
    } else {
      delete subMap[cat];
    }

    this.selectedSubcategoriesMap = subMap;
    this.selectedSubcategoriesMapChange.emit(subMap);
  }

  isSubcategorySelected(categoryValue: string, subValue: string): boolean {
    const cat = ProductUtils.normalize(categoryValue);
    const sub = ProductUtils.normalize(subValue);
    const arr = this.selectedSubcategoriesMap[cat] || [];
    return arr.includes(sub);
  }

  toggleSize(size: string): void {
    const s = String(size).toUpperCase();
    if (!this.allowedSizes.includes(s)) return;
    const updated = [...this.selectedSizes];
    const idx = updated.indexOf(s);
    if (idx >= 0) {
      updated.splice(idx, 1);
    } else {
      updated.push(s);
    }
    this.selectedSizes = updated;
    this.selectedSizesChange.emit(updated);
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.includes(String(size).toUpperCase());
  }

  onPriceInputChange(which: 'min' | 'max', value: number): void {
    const num = Math.max(0, Math.min(500000, Number(value ?? 0)));
    if (which === 'min') {
      this.priceMin = Math.min(num, this.priceMax);
      this.priceMinChange.emit(this.priceMin);
    } else {
      this.priceMax = Math.max(num, this.priceMin);
      this.priceMaxChange.emit(this.priceMax);
    }
  }

  getSelectedSubcategoriesFlat(): { category: string; subcategory: string }[] {
    const out: { category: string; subcategory: string }[] = [];
    this.selectedCategories.forEach(cat => {
      const subs = this.selectedSubcategoriesMap[cat] || [];
      subs.forEach(sub => out.push({ category: cat, subcategory: sub }));
    });
    return out;
  }

  removeCategory(categoryValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const updated = [...this.selectedCategories];
    const idx = updated.indexOf(cat);
    if (idx >= 0) {
      updated.splice(idx, 1);
    }
    const subMap = { ...this.selectedSubcategoriesMap };
    delete subMap[cat];

    this.selectedCategories = updated;
    this.selectedCategoriesChange.emit(updated);
    this.selectedSubcategoriesMap = subMap;
    this.selectedSubcategoriesMapChange.emit(subMap);

    if (updated.length > 0) {
      this.applyFilters.emit(false);
    }
  }

  removeSubcategory(categoryValue: string, subValue: string): void {
    const cat = ProductUtils.normalize(categoryValue);
    const sub = ProductUtils.normalize(subValue);
    const subMap = { ...this.selectedSubcategoriesMap };
    const arr = [...(subMap[cat] || [])];
    const idx = arr.indexOf(sub);

    if (idx >= 0) {
      arr.splice(idx, 1);
      if (arr.length) {
        subMap[cat] = arr;
      } else {
        delete subMap[cat];
      }
    }

    this.selectedSubcategoriesMap = subMap;
    this.selectedSubcategoriesMapChange.emit(subMap);
    this.applyFilters.emit(false);
  }

  clearFilters(): void {
    this.clearFiltersAction.emit();
  }

  hasFiltersApplied(): boolean {
    if (this.selectedSizes.length > 0) return true;
    if (this.priceMin !== 0) return true;
    if (this.priceMax !== 500000) return true;
    return (this.selectedCategories.length > 0) || (Object.values(this.selectedSubcategoriesMap).flat().length > 0) || (this.selectedCollectionId !== null) || (this.selectedBridesCollectionId !== null);
  }

  applyFiltersAction(isMobile: boolean = false): void {
    this.applyFilters.emit(isMobile);
  }

  onOverlayClick(event: MouseEvent): void {
    this.toggleFilters();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.showFiltersChange.emit(this.showFilters);
  }

  private isBridalProduct(p: Product): boolean {
    if (p.isBridal) return true;
    const source = (p as any)?.source_module;
    if (source === 'bridal') return true;
    const catName = ProductUtils.normalize(typeof p.category === 'string' ? p.category : (p.category?.name ?? ''));
    return catName === 'vestidos de novia' || catName === 'velos';
  }
}
