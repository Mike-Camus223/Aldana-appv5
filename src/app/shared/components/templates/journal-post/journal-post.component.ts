import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JournalService } from '../../../../core/services/data-access/journal/journal.service';
import { JournalPostBlock, JournalPostDetail } from '../../../../core/services/data-access/journal/journal.models';
import { LinkHoverUnderlineDirective } from '../../../utils/directives/link-hover-underline.directive';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';

@Component({
  selector: 'app-journal-post',
  standalone: true,
  imports: [CommonModule, RouterLink, LinkHoverUnderlineDirective, CardInitAnimationDirective ,WordRevealDirective],
  templateUrl: './journal-post.component.html',
  styleUrl: './journal-post.component.css',
})
export class JournalPostComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private journalService = inject(JournalService);

  post: JournalPostDetail | null = null;
  loading = true;
  notFound = false;

  private imageCounter = 0;

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      this.loading = true;
      this.notFound = false;
      this.post = null;
      this.imageCounter = 0;

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
        this.notFound = !this.post;
      } catch {
        this.notFound = true;
      } finally {
        this.loading = false;
      }
    });
  }

  getImageIndex(block: JournalPostBlock): number {
    if ((block as any).__imgIndex !== undefined) {
      return (block as any).__imgIndex;
    }

    if (this.isImageBlock(block)) {
      this.imageCounter++;
      (block as any).__imgIndex = this.imageCounter;
      return this.imageCounter;
    }

    return -1;
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

  isLinkBlock(block: JournalPostBlock): boolean {
    return block.type === 'link';
  }

  isImageBlock(block: JournalPostBlock): boolean {
    const t = (block.type || '').toLowerCase();
    return t === 'image' || t === 'img' || t === 'cover';
  }
}