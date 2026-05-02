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

import {
  ChevronDown,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
} from 'lucide-angular';

type SortOrder = 'desc' | 'asc';

type OptimizedJournalPost = JournalPostListRow & {
  cachedHref: string | null;
  formattedDate: string;
  cachedCover: string;
};

type QueryPatch = Record<string, string | number | null>;

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    WordRevealDirective,
    LinkHoverUnderlineDirective,
    CardInitAnimationDirective,
    LucideAngularModule,
  ],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.css',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ChevronDown,
      }),
    },
  ],
})
export class JournalComponent implements OnInit, OnDestroy {
  private readonly journalService = inject(JournalService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly pageSize = 9;

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

  categories: JournalCategory[] = [];
  posts: OptimizedJournalPost[] = [];
  yearOptions: number[] = [];
  monthOptions: number[] = [];
  pagesArray: number[] = [];

  totalCount = 0;
  currentPage = 1;

  selectedCategorySlug: string | null = null;
  selectedYear: number | null = null;
  selectedMonth: number | null = null;
  sortOrder: SortOrder = 'desc';

  loading = true;
  metaLoaded = false;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get isMonthDisabled(): boolean {
    return this.selectedYear == null || this.monthOptions.length === 0;
  }

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

  private applyRouteQuery(params: ParamMap): void {
    this.selectedCategorySlug = this.parseStringParam(
      params.get('categoria')
    );

    this.selectedYear = this.parseNumberParam(
      params.get('anio')
    );

    this.selectedMonth = this.parseNumberParam(
      params.get('mes')
    );

    this.sortOrder =
      params.get('orden') === 'asc' ? 'asc' : 'desc';

    this.currentPage = Math.max(
      1,
      this.parseNumberParam(params.get('pagina')) ?? 1
    );
  }

  private parseStringParam(
    value: string | null
  ): string | null {
    return value?.trim() || null;
  }

  private parseNumberParam(
    value: string | null
  ): number | null {
    if (!value) return null;

    const parsed = Number(value);

    return Number.isNaN(parsed) ? null : parsed;
  }

  private async runQueryLoad(): Promise<void> {
    if (!this.metaLoaded) return;

    this.loading = true;

    try {
      const effectiveMonth =
        await this.resolveEffectiveMonth();

      const { rows, total } =
        await this.journalService.listPublishedPosts({
          categoryId: this.resolveCategoryId(),
          year: this.selectedYear,
          month: effectiveMonth,
          order: this.sortOrder,
          page: this.currentPage,
          pageSize: this.pageSize,
        });

      this.posts = rows.map((post) =>
        this.optimizePost(post)
      );

      this.totalCount = total;

      this.ensureValidPage();
      this.rebuildPagesArray();
    } catch (error) {
      console.error(error);
      this.posts = [];
      this.totalCount = 0;
      this.pagesArray = [];
    } finally {
      this.loading = false;
    }
  }

  private async resolveEffectiveMonth(): Promise<number | null> {
    let effectiveMonth = this.selectedMonth;

    if (this.selectedYear == null) {
      this.monthOptions = [];
      return null;
    }

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

    return effectiveMonth;
  }

  private optimizePost(
    post: JournalPostListRow
  ): OptimizedJournalPost {
    return {
      ...post,
      cachedHref: JournalService.buildPostPath(post),
      formattedDate: this.formatPublished(post),
      cachedCover: post.cover_image || '',
    };
  }

  private resolveCategoryId(): string | undefined {
    if (!this.selectedCategorySlug) return undefined;

    return this.categories.find(
      (cat) => cat.slug === this.selectedCategorySlug
    )?.id;
  }

  private ensureValidPage(): void {
    if (this.currentPage <= this.totalPages) return;

    this.currentPage = this.totalPages;

    this.patchQuery({
      pagina:
        this.totalPages > 1 ? this.totalPages : null,
    });
  }

  private rebuildPagesArray(): void {
    this.pagesArray = Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  private navigateQuery(
    partial: QueryPatch
  ): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: partial,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private patchQuery(
    partial: QueryPatch
  ): void {
    this.navigateQuery(partial);
  }

  selectCategory(slug: string | null): void {
    this.navigateQuery({
      categoria: slug,
      pagina: null,
    });
  }

  onYearChange(value: string): void {
    this.navigateQuery({
      anio: this.parseNumberParam(value),
      mes: null,
      pagina: null,
    });
  }

  onMonthChange(value: string): void {
    this.navigateQuery({
      mes: this.parseNumberParam(value),
      pagina: null,
    });
  }

  onSortChange(value: string): void {
    const order: SortOrder =
      value === 'asc' ? 'asc' : 'desc';

    this.navigateQuery({
      orden: order === 'desc' ? null : order,
      pagina: null,
    });
  }

  isCategoryActive(
    slug: string | null
  ): boolean {
    return this.selectedCategorySlug === slug;
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

  formatPublished(
    post: JournalPostListRow
  ): string {
    if (post.published_at) {
      return new Date(
        post.published_at
      ).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    if (
      post.year != null &&
      post.month != null
    ) {
      return `01.${String(post.month).padStart(
        2,
        '0'
      )}.${post.year}`;
    }

    return '';
  }

  numStr(value: number | null): string {
    return value == null ? '' : String(value);
  }
}