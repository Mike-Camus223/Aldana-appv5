import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import { GenLightboxVanillaComponent } from '../gen-lightbox-vanilla/gen-lightbox-vanilla.component';

@Component({
  selector: 'app-gen-gallery-vanilla',
  standalone: true,
  imports: [CommonModule, GenLightboxVanillaComponent],
  templateUrl: './gen-gallery-vanilla.component.html',
  styleUrl: './gen-gallery-vanilla.component.css',
})
export class GenGalleryVanillaComponent implements OnChanges {
  @Input() media: MediaItem[] = [];
  /**
   * Si viene definido, abre el lightbox en ese índice.
   * Útil para deep-links tipo /imagen-1 o /video.
   */
  @Input() openIndex: number | null = null;

  lightboxOpen = false;
  lightboxIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['openIndex']) {
      const idx = this.openIndex;
      if (idx === null || idx === undefined) return;
      if (!Array.isArray(this.media) || this.media.length === 0) return;
      const clamped = Math.max(0, Math.min(this.media.length - 1, idx));
      this.openLightbox(clamped);
    }
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }
}
