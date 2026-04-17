import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { BettercustomDualComponent } from '../../generic/bettercustom-dual/bettercustom-dual.component';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import { CollectionWithMedia } from '../../../utils/models/collection.model';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { GenGalleryVanillaComponent } from '../../generic/gen-gallery-vanilla/gen-gallery-vanilla.component';

@Component({
  selector: 'app-generic-collection',
  standalone: true,
  imports: [CommonModule, BettercustomDualComponent, BreadcrumbComponent,GenGalleryVanillaComponent],
  templateUrl: './generic-collection.component.html',
  styleUrls: ['./generic-collection.component.css'],
})
export class GenericCollectionComponent implements OnInit {
  collectionTitle = '';
  collectionSubtitle = '';
  collectionBanner = '';
  collectionDescription = '';
  sections: { title: string; media: MediaItem[] }[] = [];
  breadcrumbItems: AppMenuItem[] = [];


  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    const collection = await this.supabaseService.getCollectionById(slug) as CollectionWithMedia;
    if (!collection) return;

    this.breadcrumbItems = [
      { label: 'INICIO', route: '/home' },
      { label: 'COLECCIONES', route: '/colecciones' },
      { label: collection.name.toUpperCase(), route: `/colecciones/${slug}` }
    ];

    this.collectionTitle = collection.name;
    this.collectionSubtitle = `- COLECCIÓN ${new Date(collection.release_date).getFullYear()}`;
    this.collectionBanner = collection.banner || '';
    this.collectionDescription = collection.description || '';

    const groupedSections: { [key: string]: MediaItem[] } = {};
    for (const media of collection.collection_media.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
      if (!groupedSections[media.section_name]) {
        groupedSections[media.section_name] = [];
      }

      groupedSections[media.section_name].push({
        url: media.media_url,
        alt: media.alt || '',
        type: media.type,
        fit: 'contain',
        ...(media.type === 'video' ? { width: 1280, height: 720, poster: media.poster_url } : {}),
      });
    }

    this.sections = Object.entries(groupedSections).map(([title, media]) => ({ title, media }));
  }

  onMediaClick(item: MediaItem) {
  }
}
