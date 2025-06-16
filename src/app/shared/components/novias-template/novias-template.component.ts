import {
  Component,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import { VideoComponent } from '../video/video.component';
@Component({
  selector: 'app-novias-template',
  standalone: true,
  imports: [CommonModule, VideoComponent],
  templateUrl: './novias-template.component.html',
  styleUrls: ['./novias-template.component.css'],
})
export class NoviasTemplateComponent implements AfterViewInit, OnDestroy {
  images = [
    { url: 'https://picsum.photos/id/229/600/600', alt: 'Image 1' },
    { url: 'https://picsum.photos/id/429/600/600', alt: 'Image 2' },
    { url: 'https://picsum.photos/id/629/600/600', alt: 'Image 3' },
    { url: 'https://picsum.photos/id/329/600/600', alt: 'Image 4' },
    { url: 'https://picsum.photos/id/459/600/600', alt: 'Image 5' },
    { url: 'https://picsum.photos/id/149/600/600', alt: 'Image 6' },
    { url: 'https://picsum.photos/id/159/600/600', alt: 'Image 7' },
    { url: 'https://picsum.photos/id/267/600/600', alt: 'Image 8' },
  ];

  

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
    });
  }

  ngOnDestroy() {
    Fancybox.destroy();
  }
}
