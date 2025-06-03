import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

@Component({
  selector: 'app-generic-gallery-templ',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-gallery-templ.component.html',
  styleUrls: ['./generic-gallery-templ.component.css']
})
export class GenericGalleryTemplComponent implements AfterViewInit {
  images = [
    { id: 1025 },
    { id: 1043 },
    { id: 1062 },
    { id: 1074 },
    { id: 1084 },
    { id: 1024 },
    { id: 1003 },
    { id: 1012 },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
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
  }
}
