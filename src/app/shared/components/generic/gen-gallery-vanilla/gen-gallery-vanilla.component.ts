import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import { GenLightboxVanillaComponent } from '../gen-lightbox-vanilla/gen-lightbox-vanilla.component';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';


@Component({
  selector: 'app-gen-gallery-vanilla',
  standalone: true,
  imports: [CommonModule, GenLightboxVanillaComponent, CardInitAnimationDirective],
  templateUrl: './gen-gallery-vanilla.component.html',
})
export class GenGalleryVanillaComponent {

  @Input() rows: { label: string; items: MediaItem[] }[] = [];

  lightboxOpen = false;
  lightboxIndex = 0;
  lightboxItems: MediaItem[] = [];

  openLightbox(items: MediaItem[], index: number) {
    this.lightboxItems = items;
    this.lightboxIndex = index;
    this.lightboxOpen = true;
  }

  closeLightbox() {
    this.lightboxOpen = false;
  }
}