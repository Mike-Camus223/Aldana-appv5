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
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';

import { JournalService } from '../../../../core/services/data-access/journal/journal.service';
import {
  JournalCategory,
  JournalPostListRow,
} from '../../../../core/services/data-access/journal/journal.models';

type OptimizedJournalPost = JournalPostListRow & {
  cachedHref: string | null;
  formattedDate: string;
  cachedCover: string;
};

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
  posts: OptimizedJournalPost[] = [];
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async bootstrap(): Promise<void> {
    this.loading = true;

    try {
      const [categories, years] = await Promise.all([
        this.journalService.getCategories(),
        this.journalService.getPublishedYears(),
      ]);

      this.categories = categories;
      this.yearOptions = years;
    } catch (error) {
      console.error(error);
      this.categories = [];
      this.yearOptions = [];
    }

    this.metaLoaded = true;

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.applyRouteQuery(params);
        void this.runQueryLoad();
      });
  }

  private applyRouteQuery(q: ParamMap): void {
    const cat = q.get('categoria');
    this.selectedCategorySlug = cat?.trim() ? cat : null;

    const y = q.get('anio');
    this.selectedYear =
      y && !Number.isNaN(Number(y)) ? Number(y) : null;

    const m = q.get('mes');
    this.selectedMonth =
      m && !Number.isNaN(Number(m)) ? Number(m) : null;

    const ord = q.get('orden');
    this.sortOrder = ord === 'asc' ? 'asc' : 'desc';

    const p = q.get('pagina');
    this.currentPage =
      p && !Number.isNaN(Number(p))
        ? Math.max(1, Number(p))
        : 1;
  }

  private async runQueryLoad(): Promise<void> {
    if (!this.metaLoaded) return;

    this.loading = true;

    try {
      let effectiveMonth = this.selectedMonth;

      if (this.selectedYear != null) {
        this.monthOptions =
          await this.journalService.getPublishedMonthsForYear(
            this.selectedYear
          );

        if (
          effectiveMonth != null &&
          !this.monthOptions.includes(effectiveMonth)
        ) {
          effectiveMonth = null;

          if (this.route.snapshot.queryParamMap.get('mes')) {
            queueMicrotask(() =>
              this.patchQuery({ mes: null })
            );
          }
        }
      } else {
        this.monthOptions = [];
        effectiveMonth = null;
      }

      const categoryId = this.resolveCategoryId();

      const { rows, total } =
        await this.journalService.listPublishedPosts({
          categoryId,
          year: this.selectedYear,
          month: effectiveMonth,
          order: this.sortOrder,
          page: this.currentPage,
          pageSize: this.pageSize,
        });

      this.posts = rows.map((post) => ({
        ...post,
        cachedHref: JournalService.buildPostPath(post),
        formattedDate: this.formatPublished(post),
        cachedCover: post.cover_image || '',
      }));

      this.totalCount = total;

      const totalPages = this.totalPages;

      if (this.currentPage > totalPages) {
        this.currentPage = totalPages;

        this.patchQuery({
          pagina: totalPages > 1 ? totalPages : null,
        });
      }

      this.rebuildPagesArray();
    } catch (error) {
      console.error(error);
      this.posts = [];
      this.totalCount = 0;
    } finally {
      this.loading = false;
    }
  }

  private resolveCategoryId(): string | undefined {
    if (!this.selectedCategorySlug) return undefined;

    return this.categories.find(
      (c) => c.slug === this.selectedCategorySlug
    )?.id;
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.totalCount / this.pageSize)
    );
  }

  private rebuildPagesArray(): void {
    this.pagesArray = Array.from(
      { length: this.totalPages },
      (_, i) => i + 1
    );
  }

  private navigateQuery(
    partial: Record<string, string | number | null>
  ): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: partial,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private patchQuery(
    partial: Record<string, string | number | null>
  ): void {
    this.navigateQuery(partial);
  }

  selectCategory(slug: string | null): void {
    this.navigateQuery({
      categoria: slug || null,
      pagina: null,
    });
  }

  onYearChange(value: string): void {
    const year = value === '' ? null : Number(value);

    this.navigateQuery({
      anio: year,
      mes: null,
      pagina: null,
    });
  }

  onMonthChange(value: string): void {
    const month = value === '' ? null : Number(value);

    this.navigateQuery({
      mes: month,
      pagina: null,
    });
  }

  onSortChange(value: string): void {
    const order = value === 'asc' ? 'asc' : 'desc';

    this.navigateQuery({
      orden: order === 'desc' ? null : 'asc',
      pagina: null,
    });
  }

  isCategoryActive(slug: string | null): boolean {
    if (slug === null) {
      return this.selectedCategorySlug === null;
    }

    return this.selectedCategorySlug === slug;
  }

  trackByPostId(
    index: number,
    post: OptimizedJournalPost
  ): string {
    return (
      post.id ||
      post.slug ||
      `${post.year}-${post.month}-${index}`
    );
  }

  postHref(post: JournalPostListRow): string | null {
    return JournalService.buildPostPath(post);
  }

  formatPublished(post: JournalPostListRow): string {
    if (post.published_at) {
      const date = new Date(post.published_at);

      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    if (post.year != null && post.month != null) {
      return `01.${String(post.month).padStart(
        2,
        '0'
      )}.${post.year}`;
    }

    return '';
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.navigateQuery({
      pagina: page > 1 ? page : null,
    });
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  coverSrc(post: OptimizedJournalPost): string {
    return post.cachedCover;
  }

  numStr(n: number | null): string {
    return n == null ? '' : `${n}`;
  }
}