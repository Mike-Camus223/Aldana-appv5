import { Component } from '@angular/core';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import { CollectionBridesWithMedia } from '../../../utils/models/collection.model';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { GalleryGenComComponent } from '../../sections/gallery-gen-com/gallery-gen-com.component';
import { BettercustomDualComponent } from '../../generic/bettercustom-dual/bettercustom-dual.component';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { CommonModule } from '@angular/common';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';

@Component({
  selector: 'app-generic-collection-brides',
  standalone: true,
  imports: [CommonModule, RouterModule, GalleryGenComComponent, BettercustomDualComponent, BreadcrumbComponent],
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
  products: { name: string; slug: string; main_image: string; description?: string }[] = [];
  collectionSlug = '';


  constructor(
    private getData: CollectionBridesService,
    private bridesProducts: BridesProductsService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.collectionSlug = slug;

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

    // Productos de la colección (cards que navegan a items-collection)
    try {
      const res: any = await this.bridesProducts.getProducts();
      const rows = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : []);
      this.products = rows
        .filter((p: any) => {
          const pcs = Array.isArray(p?.product_collections) ? p.product_collections : [];
          return pcs.some((pc: any) => String(pc?.collections?.slug || '') === slug);
        })
        .map((p: any) => ({
          name: p?.name || '',
          slug: p?.slug || '',
          main_image: p?.main_image || '',
          description: p?.description || ''
        }))
        .filter((p: any) => Boolean(p.slug) && Boolean(p.main_image));
    } catch {
      this.products = [];
    }

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
