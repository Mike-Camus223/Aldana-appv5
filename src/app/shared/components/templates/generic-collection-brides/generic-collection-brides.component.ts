import { Component } from '@angular/core';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import { CollectionBridesWithMedia } from '../../../utils/models/collection.model';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { ActivatedRoute } from '@angular/router';
import { GalleryGenComComponent } from '../../sections/gallery-gen-com/gallery-gen-com.component';
import { BettercustomDualComponent } from '../../generic/bettercustom-dual/bettercustom-dual.component';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { CommonModule } from '@angular/common';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';

@Component({
  selector: 'app-generic-collection-brides',
  standalone: true,
  imports: [CommonModule, GalleryGenComComponent, BettercustomDualComponent, BreadcrumbComponent],
  templateUrl: './generic-collection-brides.component.html',
  styleUrl: './generic-collection-brides.component.css'
})
export class GenericCollectionBridesComponent {
  collectionTitle = '';
  collectionSubtitle = '';
  collectionBanner = '';
  collectionDescription = '';
  sections: { title: string; media: MediaItem[] }[] = [];
  breadcrumbItems: AppMenuItem[] = [];


  constructor(
    private getData: CollectionBridesService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    const collectionResult = await this.getData.getCollectionBridesBySlug(slug) as unknown as CollectionBridesWithMedia;
    if (!collectionResult) return;
    
    this.breadcrumbItems = [
      { label: 'INICIO', route: '/home' },
      { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
      { label: collectionResult.name.toUpperCase(), route: `/novias-colecciones/${slug}` }
    ];

    this.collectionTitle = collectionResult.name;
    this.collectionSubtitle = `- COLECCIÓN ${new Date(collectionResult.release_date).getFullYear()}`;
    this.collectionBanner = collectionResult.banner || '';
    this.collectionDescription = collectionResult.description || '';

    const groupedSections: { [key: string]: MediaItem[] } = {};
    for (const media of collectionResult.collection_media_brides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
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
