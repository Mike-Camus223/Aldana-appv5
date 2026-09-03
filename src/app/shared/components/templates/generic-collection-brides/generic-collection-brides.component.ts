import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AppMenuItem } from '../../../models/app-menu-item.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';

import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { BridesProductUtils } from '../../../utils/mappers/bridal-product.mapper';
import { CardInitAnimationDirective } from '../../../directives/animations/card-init-animation.directive';
import { VideoComponent } from '../../generic/video/video.component';
import { WordRevealDirective } from '../../../directives/animations/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../directives/animations/fadeupletter.directive';

type BridesCollectionItemCard = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  thumbUrl?: string | null;
};

@Component({
  selector: 'app-generic-collection-brides',
  standalone: true,
  imports: [RouterModule, BreadcrumbComponent, CardInitAnimationDirective, VideoComponent, WordRevealDirective, FadeUpLetterDirective],
  templateUrl: './generic-collection-brides.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './generic-collection-brides.component.css'
})
export class GenericCollectionBridesComponent implements OnInit {
  collectionTitle = '';
  collectionSubtitle = '';
  collectionBanner = '';
  collectionDescription = '';
  breadcrumbItems: AppMenuItem[] = [];
  collectionSlug = '';
  items: BridesCollectionItemCard[] = [];

  constructor(
    private getData: CollectionBridesService,
    private bridesProducts: BridesProductsService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.collectionSlug = slug;

    const collectionResult = await this.getData.getCollectionBridesBySlug(slug) as any;
    if (!collectionResult) return;

    const col = Array.isArray(collectionResult) ? collectionResult[0] : collectionResult;
    if (!col?.id) return;

    this.breadcrumbItems = [
      { label: 'INICIO', route: '/' },
      { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
      { label: String(col.name || '').toUpperCase(), route: `/novias-colecciones/${slug}` }
    ];

    this.collectionTitle = col.name;
    this.collectionSubtitle = `COLECCIÓN ${new Date(col.release_date).getFullYear()}`;
    this.collectionBanner = col.banner || '';
    this.collectionDescription = col.description || '';

    const rows = await this.getData.getCollectionBridesItemsByCollectionId(String(col.id)) as any[];

    const pickThumbFromMedia = (mediaItems: any[] | undefined | null): string | null => {
      const m = Array.isArray(mediaItems) ? mediaItems : [];
      // Intentar encontrar primero una imagen con use 'collection' o 'shop'
      const collectionMedia = m.find(x => x.type === 'image' && Array.isArray(x.use) && x.use.includes('collection'));
      if (collectionMedia) return collectionMedia.url;
      
      const shopMedia = m.find(x => x.type === 'image' && Array.isArray(x.use) && x.use.includes('shop'));
      if (shopMedia) return shopMedia.url;

      // Fallback al comportamiento antiguo de orden
      const sorted = [...m].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
      const firstImage = sorted.find(x => String(x?.type) === 'image');
      return String(firstImage?.media_url || firstImage?.url || '').trim() || null;
    };

    this.items = (Array.isArray(rows) ? rows : [])
      .map((r: any) => {
        const product = r.pbrides_products;
        if (!product) return null;
        return {
          id: String(product.id || ''),
          slug: String(product.slug || ''),
          title: String(product.name || ''),
          subtitle: null,
          description: product.description ?? null,
          thumbUrl: product.main_image || pickThumbFromMedia(product.media)
        };
      })
      .filter(x => x !== null && Boolean(x.slug) && Boolean(x.title)) as BridesCollectionItemCard[];
  }

  trackById(_: number, it: BridesCollectionItemCard) {
    return it.id;
  }
}
