import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MediaItem } from '../../../models/objectsGallery.model';
import { GenLightboxVanillaComponent } from '../../generic/gen-lightbox-vanilla/gen-lightbox-vanilla.component';
import { CardInitAnimationDirective } from '../../../directives/animations/card-init-animation.directive';
import { WordRevealDirective } from '../../../directives/animations/word-reveal.directive';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-gen-gallery-vanilla',
  standalone: true,
  imports: [CommonModule, GenLightboxVanillaComponent, CardInitAnimationDirective, WordRevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gen-gallery-vanilla.component.html',
  styleUrls: ['./gen-gallery-vanilla.component.css']
})
export class GenGalleryVanillaComponent implements OnChanges {

  @Input() rows: { label: string; items: MediaItem[] }[] = [];

  lightboxOpen = false;
  lightboxIndex = 0;
  lightboxItems: MediaItem[] = [];
  lightboxTitle = '';

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows']) {
      this.cdr.markForCheck();
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
          }
          this.cdr.detectChanges();
        }, 60);
      }
    }
  }

  openLightbox(items: MediaItem[], index: number, rowLabel?: string) {
    this.lightboxItems = [...items];
    this.lightboxIndex = index;
    this.lightboxTitle = rowLabel || items[index]?.alt || '';
    this.lightboxOpen = true;
    this.cdr.markForCheck();
  }

  onLightboxIndexChange(index: number) {
    this.lightboxIndex = index;
    this.cdr.markForCheck();
  }

  closeLightbox() {
    this.lightboxOpen = false;
    this.cdr.markForCheck();
  }
}
