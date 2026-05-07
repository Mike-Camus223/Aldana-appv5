import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  LUCIDE_ICONS,
  LucideIconProvider,
} from 'lucide-angular';

import { JournalService } from '../../../../core/services/data-access/journal/journal.service';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';

import {
  JournalPostBlock,
  JournalPostDetail,
} from '../../../../core/services/data-access/journal/journal.models';

import { LinkHoverUnderlineDirective } from '../../../utils/directives/link-hover-underline.directive';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';

export interface SectionGroup {
  group: number;
  layout: string;
  blocks: JournalPostBlock[];
  carouselProducts?: any[];
  carouselCollectionSlug?: string;
  carouselIsBrides?: boolean;
  carouselIndex: number;
}

@Component({
  selector: 'app-journal-post',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LinkHoverUnderlineDirective,
    CardInitAnimationDirective,
    WordRevealDirective,
    FadeUpLetterDirective,
    LucideAngularModule,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronLeft, ChevronRight }),
    },
  ],
  templateUrl: './journal-post.component.html',
  styleUrl: './journal-post.component.css',
})
export class JournalPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private journalService = inject(JournalService);
  private collectionService = inject(CollectionService);
  private collectionBridesService = inject(CollectionBridesService);

  post: JournalPostDetail | null = null;
  loading = true;
  notFound = false;
  sections: SectionGroup[] = [];
  visibleProducts = 4;

  @HostListener('window:resize')
  onResize(): void {
    this.updateVisibleProducts();
  }

  private updateVisibleProducts(): void {
    const w = window.innerWidth;
    if (w < 640) this.visibleProducts = 2;
    else if (w < 1024) this.visibleProducts = 3;
    else if (w < 1440) this.visibleProducts = 4;
    else this.visibleProducts = 5;
  }

  ngOnInit(): void {
    this.updateVisibleProducts();

    this.route.paramMap.subscribe(async (params) => {
      this.loading = true;
      this.notFound = false;
      this.post = null;
      this.sections = [];

      const categorySlug = params.get('categorySlug') ?? '';
      const year = Number(params.get('year'));
      const month = Number(params.get('month'));
      const postSlug = params.get('postSlug') ?? '';

      if (
        !categorySlug ||
        !postSlug ||
        Number.isNaN(year) ||
        Number.isNaN(month)
      ) {
        this.loading = false;
        this.notFound = true;
        return;
      }

      try {
        this.post = await this.journalService.getPublishedPostDetail(
          categorySlug,
          year,
          month,
          postSlug
        );

        if (!this.post) {
          this.notFound = true;
        } else {
          await this.buildSections();
        }
      } catch {
        this.notFound = true;
      } finally {
        this.loading = false;
      }
    });
  }

  async buildSections(): Promise<void> {
    if (!this.post?.blocks?.length) {
      this.sections = [];
      return;
    }

    const grouped = new Map<number, JournalPostBlock[]>();

    for (const block of this.post.blocks) {
      const group = block.section_group ?? 1;
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group)!.push(block);
    }

    const raw: SectionGroup[] = Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([group, blocks]) => ({
        group,
        layout: blocks[0].layout_variant ?? 'full',
        blocks: blocks.sort((a, b) => a.position - b.position),
        carouselIndex: 0,
      }));

    for (const section of raw) {
      if (section.layout !== 'collection-carousel') continue;

      const block = section.blocks[0];
      const slug = block.collection_slug ?? '';
      const isBrides = block.collection_type === 'brides';

      section.carouselCollectionSlug = slug;
      section.carouselIsBrides = isBrides;

      if (!slug) {
        section.carouselProducts = [];
        continue;
      }

      try {
        if (isBrides) {
          const col =
            await this.collectionBridesService.getCollectionBridesBySlug(slug);
          if (col) {
            const items =
              await this.collectionBridesService.getCollectionBridesItemsByCollectionId(
                String(col.id)
              );
            section.carouselProducts = items
              .map((i: any) => i.pbrides_products)
              .filter(Boolean);
          }
        } else {
          const col = await this.collectionService.getCollectionBySlug(slug);
          if (col) {
            const items =
              await this.collectionService.getCollectionItemsByCollectionId(
                String(col.id)
              );
            section.carouselProducts = items
              .map((i: any) => i.products)
              .filter(Boolean);
          }
        }
      } catch {
        section.carouselProducts = [];
      }
    }

    this.sections = raw;
  }

  // ── Carousel helpers ────────────────────────────────────────────────────────

  getMaxIndex(section: SectionGroup): number {
    return Math.max(
      0,
      (section.carouselProducts?.length ?? 0) - this.visibleProducts
    );
  }

  carouselTranslate(section: SectionGroup): string {
    return `translateX(-${section.carouselIndex * (100 / this.visibleProducts)}%)`;
  }

  carouselNext(section: SectionGroup): void {
    const max = this.getMaxIndex(section);
    section.carouselIndex = section.carouselIndex >= max ? 0 : section.carouselIndex + 1;
  }

  carouselPrev(section: SectionGroup): void {
    const max = this.getMaxIndex(section);
    section.carouselIndex = section.carouselIndex <= 0 ? max : section.carouselIndex - 1;
  }

  // ── Block helpers ────────────────────────────────────────────────────────────

  isImageBlock(block: JournalPostBlock): boolean {
    return ['image', 'img', 'cover'].includes((block.type ?? '').toLowerCase());
  }

  isTextBlock(block: JournalPostBlock): boolean {
    return !this.isImageBlock(block);
  }

  getImage(section: SectionGroup): JournalPostBlock | undefined {
    return section.blocks.find((b) => this.isImageBlock(b));
  }

  getText(section: SectionGroup): JournalPostBlock | undefined {
    return section.blocks.find((b) => this.isTextBlock(b));
  }

  // ── Date ─────────────────────────────────────────────────────────────────────

  formatDate(p: JournalPostDetail): string {
    if (p.published_at) {
      return new Date(p.published_at).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    if (p.year != null && p.month != null) {
      return `01.${String(p.month).padStart(2, '0')}.${p.year}`;
    }
    return '';
  }
}