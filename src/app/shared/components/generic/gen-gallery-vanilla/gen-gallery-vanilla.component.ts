import { Component, Input } from '@angular/core';
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
export class GenGalleryVanillaComponent {
  @Input() media: MediaItem[] = [];

  lightboxOpen = false;
  lightboxIndex = 0;

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }
}
