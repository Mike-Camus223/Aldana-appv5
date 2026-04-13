import {
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  RouterModule,
} from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { LinkHoverUnderlineDirective } from '../../../utils/directives/link-hover-underline.directive';
import { JournalService } from '../../../../core/services/data-access/journal/journal.service';
import {
  JournalCategory,
  JournalPostListRow,
} from '../../../../core/services/data-access/journal/journal.models';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';

@Component({
  selector: 'app-journal',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    WordRevealDirective,
    LinkHoverUnderlineDirective,
    CardInitAnimationDirective,
  ],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.css',
})
export class JournalComponent implements OnInit, OnDestroy {
  private journalService = inject(JournalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  categories: JournalCategory[] = [];
  posts: JournalPostListRow[] = [];
  totalCount = 0;

  selectedCategorySlug: string | null = null;
  selectedYear: number | null = null;
  selectedMonth: number | null = null;
  sortOrder: 'desc' | 'asc' = 'desc';

  yearOptions: number[] = [];
  monthOptions: number[] = [];

  loading = true;
  metaLoaded = false;

  readonly pageSize = 9;
  currentPage = 1;
  pagesArray: number[] = [];

  readonly monthLabels: Record<number, string> = {
    1: 'Enero',
    2: 'Febrero',
    3: 'Marzo',
    4: 'Abril',
    5: 'Mayo',
    6: 'Junio',
    7: 'Julio',
    8: 'Agosto',
    9: 'Septiembre',
    10: 'Octubre',
    11: 'Noviembre',
    12: 'Diciembre',
  };

  ngOnInit(): void {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    this.loading = true;
    try {
      this.categories = await this.journalService.getCategories();
      this.yearOptions = await this.journalService.getPublishedYears();
    } catch (e) {
      console.error(e);
      this.categories = [];
      this.yearOptions = [];
    }
    this.metaLoaded = true;

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((q) => {
        this.applyRouteQuery(q);
        void this.runQueryLoad();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyRouteQuery(q: ParamMap): void {
    const cat = q.get('categoria');
    this.selectedCategorySlug = cat?.trim() ? cat : null;

    const y = q.get('anio');
    this.selectedYear =
      y != null && y !== '' && !Number.isNaN(Number(y)) ? Number(y) : null;

    const m = q.get('mes');
    this.selectedMonth =
      m != null && m !== '' && !Number.isNaN(Number(m)) ? Number(m) : null;

    const ord = q.get('orden');
    this.sortOrder = ord === 'asc' ? 'asc' : 'desc';

    const p = q.get('pagina');
    this.currentPage =
      p != null && p !== '' && !Number.isNaN(Number(p))
        ? Math.max(1, Number(p))
        : 1;
  }

  private async runQueryLoad(): Promise<void> {
    if (!this.metaLoaded) return;

    this.loading = true;
    try {
      let effectiveMonth = this.selectedMonth;
      if (this.selectedYear != null) {
        this.monthOptions = await this.journalService.getPublishedMonthsForYear(
          this.selectedYear
        );
        if (
          effectiveMonth != null &&
          !this.monthOptions.includes(effectiveMonth)
        ) {
          effectiveMonth = null;
          if (this.route.snapshot.queryParamMap.get('mes')) {
            queueMicrotask(() => this.patchQuery({ mes: null }));
          }
        }
      } else {
        this.monthOptions = [];
        effectiveMonth = null;
      }

      const categoryId = this.resolveCategoryId();

      const { rows, total } = await this.journalService.listPublishedPosts({
        categoryId,
        year: this.selectedYear,
        month: effectiveMonth,
        order: this.sortOrder,
        page: this.currentPage,
        pageSize: this.pageSize,
      });

      this.posts = rows;
      this.totalCount = total;

      const tp = this.totalPages;
      if (this.currentPage > tp) {
        this.currentPage = tp;
        this.patchQuery({ pagina: tp > 1 ? tp : null });
      }

      this.rebuildPagesArray();
    } catch (e) {
      console.error(e);
      this.posts = [];
      this.totalCount = 0;
    } finally {
      this.loading = false;
    }
  }

  private resolveCategoryId(): string | undefined {
    if (!this.selectedCategorySlug) return undefined;
    return this.categories.find((c) => c.slug === this.selectedCategorySlug)
      ?.id;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  private rebuildPagesArray(): void {
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  private navigateQuery(partial: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: partial,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private patchQuery(partial: Record<string, string | number | null>): void {
    this.navigateQuery(partial);
  }

  selectCategory(slug: string | null): void {
    this.navigateQuery({
      categoria: slug || null,
      pagina: null,
    });
  }

  onYearChange(value: string): void {
    const y = value === '' ? null : Number(value);
    this.navigateQuery({
      anio: y,
      mes: null,
      pagina: null,
    });
  }

  onMonthChange(value: string): void {
    const m = value === '' ? null : Number(value);
    this.navigateQuery({
      mes: m,
      pagina: null,
    });
  }

  onSortChange(value: string): void {
    const ord = value === 'asc' ? 'asc' : 'desc';
    this.navigateQuery({
      orden: ord === 'desc' ? null : 'asc',
      pagina: null,
    });
  }

  isCategoryActive(slug: string | null): boolean {
    if (slug === null) return this.selectedCategorySlug === null;
    return this.selectedCategorySlug === slug;
  }

  postHref(post: JournalPostListRow): string | null {
    return JournalService.buildPostPath(post);
  }

  formatPublished(post: JournalPostListRow): string {
    if (post.published_at) {
      const d = new Date(post.published_at);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    if (post.year != null && post.month != null) {
      return `01.${String(post.month).padStart(2, '0')}.${post.year}`;
    }
    return '';
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.navigateQuery({ pagina: page > 1 ? page : null });
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  coverSrc(post: JournalPostListRow): string {
    return (
      post.cover_image ||
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80'
    );
  }

  numStr(n: number | null): string {
    return n == null ? '' : `${n}`;
  }
}
