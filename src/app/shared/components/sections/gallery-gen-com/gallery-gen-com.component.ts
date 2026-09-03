import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MediaItem } from '../../../models/objectsGallery.model';

@Component({
  selector: 'app-gallery-gen-com',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-gen-com.component.html',
  styleUrls: ['./gallery-gen-com.component.css'],
})
export class GalleryGenComComponent {
  @Input() media: MediaItem[] = [];
  @Output() mediaClicked = new EventEmitter<MediaItem>();

  isOpen: boolean = false;
  selectedIndex: number = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  get currentItem(): MediaItem | null {
    return this.media && this.media.length > 0 ? this.media[this.selectedIndex] : null;
  }

  openLightbox(index: number, event: Event): void {
    event.preventDefault();
    if (!this.media || this.media.length === 0) return;

    this.selectedIndex = index;
    this.isOpen = true;
    this.mediaClicked.emit(this.media[index]);

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox(): void {
    this.isOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  nextMedia(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.media.length > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % this.media.length;
    }
  }

  prevMedia(event?: Event): void {
    if (event) event.stopPropagation();
    if (this.media.length > 0) {
      this.selectedIndex = (this.selectedIndex - 1 + this.media.length) % this.media.length;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.nextMedia();
    } else if (event.key === 'ArrowLeft') {
      this.prevMedia();
    }
  }
}
