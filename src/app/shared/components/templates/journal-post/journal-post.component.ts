import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JournalService } from '../../../../core/services/data-access/journal/journal.service';
import {
  JournalPostBlock,
  JournalPostDetail,
} from '../../../../core/services/data-access/journal/journal.models';

import { LinkHoverUnderlineDirective } from '../../../utils/directives/link-hover-underline.directive';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';

interface SectionGroup {
  group: number;
  layout: string;
  background: string;
  blocks: JournalPostBlock[];
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
  ],
  templateUrl: './journal-post.component.html',
  styleUrl: './journal-post.component.css',
})
export class JournalPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private journalService = inject(JournalService);

  post: JournalPostDetail | null = null;
  loading = true;
  notFound = false;

  sections: SectionGroup[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.loading = true;
      this.notFound = false;
      this.post = null;
      this.sections = [];

      const categorySlug = params.get('categorySlug') ?? '';
      const year = Number(params.get('year'));
      const month = Number(params.get('month'));
      const postSlug = params.get('postSlug') ?? '';

      if (!categorySlug || !postSlug || Number.isNaN(year) || Number.isNaN(month)) {
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
          this.buildSections();
        }
      } catch {
        this.notFound = true;
      } finally {
        this.loading = false;
      }
    });
  }

  buildSections(): void {
    if (!this.post?.blocks?.length) {
      this.sections = [];
      return;
    }

    const grouped = new Map<number, JournalPostBlock[]>();

    for (const block of this.post.blocks) {
      const group = (block as any).section_group ?? 1;

      if (!grouped.has(group)) {
        grouped.set(group, []);
      }

      grouped.get(group)!.push(block);
    }

    this.sections = Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([group, blocks]) => ({
        group,
        layout: (blocks[0] as any).layout_variant || 'full',
        background: (blocks[0] as any).background_style || 'white',
        blocks: blocks.sort((a, b) => a.position - b.position),
      }));
  }

  formatDate(p: JournalPostDetail): string {
    if (p.published_at) {
      const d = new Date(p.published_at);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }

    if (p.year != null && p.month != null) {
      const mm = String(p.month).padStart(2, '0');
      return `01.${mm}.${p.year}`;
    }

    return '';
  }

  isImageBlock(block: JournalPostBlock): boolean {
    const t = (block.type || '').toLowerCase();
    return t === 'image' || t === 'img' || t === 'cover';
  }

  isTextBlock(block: JournalPostBlock): boolean {
    return !this.isImageBlock(block) && !this.isButtonBlock(block);
  }

  isButtonBlock(block: JournalPostBlock): boolean {
    return block.type === 'button' || (block as any).layout_variant === 'cta';
  }

  getImage(section: SectionGroup): JournalPostBlock | undefined {
    return section.blocks.find((b) => this.isImageBlock(b));
  }

  getText(section: SectionGroup): JournalPostBlock | undefined {
    return section.blocks.find((b) => this.isTextBlock(b));
  }

  getButton(section: SectionGroup): JournalPostBlock | undefined {
    return section.blocks.find((b) => this.isButtonBlock(b));
  }
}