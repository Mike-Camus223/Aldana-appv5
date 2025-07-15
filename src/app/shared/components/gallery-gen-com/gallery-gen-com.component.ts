import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { MediaItem } from '../../utils/models/objectsGallery.model';

@Component({
  selector: 'app-gallery-gen-com',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-gen-com.component.html',
  styleUrls: ['./gallery-gen-com.component.css'],
})
export class GalleryGenComComponent implements AfterViewInit, OnDestroy {
  @Input() media: MediaItem[] = [];

  @Output() mediaClicked = new EventEmitter<MediaItem>();

  ngAfterViewInit(): void {
    Fancybox.bind("[data-fancybox='gallery']", {
      Thumbs: true,
      Toolbar: {
        display: {
          left: [],
          middle: [],
          right: ['toggleZoom', 'slideshow', 'fullscreen', 'thumbs', 'close'],
        },
      },
      Carousel: {},
    });
  }

  ngOnDestroy(): void {
    Fancybox.destroy();
  }

  handleClick(item: MediaItem, event: Event) {
    this.mediaClicked.emit(item);

    if (item.type === 'video') {
      event.preventDefault(); 
      Fancybox.show([
        {
          src: item.url,
          type: 'html5video', 
          thumb: item.poster || undefined,
          width: item.width || 1280,
          height: item.height || 1920,
        },
      ], {
        Thumbs: true,
        Toolbar: {
          display: {
            left: [],
            middle: [],
            right: ['toggleZoom', 'slideshow', 'fullscreen', 'thumbs', 'close'],
          },
        },
        ...( {
          Video: {
            autoplay: true,
            muted: true,
          },
        } as any ),
      });
    }
  }
}
