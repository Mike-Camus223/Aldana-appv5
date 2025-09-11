import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Collection } from '../../../utils/models/collection.model';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';

@Component({
  selector: 'app-generic-gallery-templ',
  standalone: true,
  imports: [CommonModule, RouterModule],
  animations: [
    trigger('gridAnimation', [
      transition('* => *', [
        style({ transform: 'scale(0.98)', opacity: 0.8 }),
        animate('400ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      state('true', style({ transform: 'translateX(0)' })),
      state('false', style({ transform: 'translateX(-100%)' })),
      transition('false => true', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition('true => false', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(-100%)' }))
      ])
    ])
  ],
  templateUrl: './generic-gallery-templ.component.html',
  styleUrls: ['./generic-gallery-templ.component.css']
})
export class GenericGalleryTemplComponent implements AfterViewInit {
  collections: Collection[] = [];
  productColumns: number = 3;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private CollectionService: CollectionService,
    private router: Router
  ) { }

  async ngAfterViewInit() {
    try {
      const result = await this.CollectionService.getAllCollections();
      this.collections = result ?? [];
    } catch (error) {
      console.error('Error al obtener colecciones:', error);
    }

    if (isPlatformBrowser(this.platformId)) {
      const { Fancybox } = await import('@fancyapps/ui');
      Fancybox.bind("[data-fancybox='gallery']", {
        Thumbs: true,
        Toolbar: {
          display: {
            left: [],
            middle: [],
            right: ['toggleZoom', 'slideshow', 'fullscreen', 'thumbs', 'close']
          }
        }
      });
    }
  }

  setProductColumns(cols: number): void {
    if (cols >= 2 && cols <= 4) {
      this.productColumns = cols;
    }
  }


  goToCollection(slug: string) {
    this.router.navigate(['/colecciones', slug]);
  }
}
