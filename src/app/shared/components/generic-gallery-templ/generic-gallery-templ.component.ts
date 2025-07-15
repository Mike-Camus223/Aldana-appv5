import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { Collection } from '../../utils/models/collection.model';

@Component({
  selector: 'app-generic-gallery-templ',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './generic-gallery-templ.component.html',
  styleUrls: ['./generic-gallery-templ.component.css']
})
export class GenericGalleryTemplComponent implements AfterViewInit {
  collections: Collection[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngAfterViewInit() {
    try {
      const result = await this.supabaseService.getAllCollections();
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

  goToCollection(slug: string) {
  this.router.navigate(['/colecciones', slug]);
}
}
