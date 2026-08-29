import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { ActivatedRoute, RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { ProductUtils } from '../../../utils/dataEx/products-utils';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';
import { VideoComponent } from '../../generic/video/video.component';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';

type CollectionItemCard = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  thumbUrl?: string | null;
};

@Component({
  selector: 'app-generic-collection',
  standalone: true,
  imports: [RouterModule, BreadcrumbComponent, CardInitAnimationDirective, VideoComponent, WordRevealDirective, FadeUpLetterDirective],
  templateUrl: './generic-collection.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./generic-collection.component.css'],
})
export class GenericCollectionComponent implements OnInit {
  collectionTitle = '';
  collectionSubtitle = '';
  collectionBanner = '';
  collectionDescription = '';
  breadcrumbItems: AppMenuItem[] = [];
  collectionSlug = '';
  items: CollectionItemCard[] = [];


  constructor(
    private collections: CollectionService,
    private supabase: SupabaseService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;
    this.collectionSlug = slug;

    const collection = await this.collections.getCollectionBySlug(slug) as any;
    if (!collection) return;

    this.breadcrumbItems = [
      { label: 'INICIO', route: '/' },
      { label: 'PRÊT-À-PORTER', route: '/pret-a-porter' },
      { label: collection.name.toUpperCase(), route: `/pret-a-porter/${slug}` }
    ];

    this.collectionTitle = collection.name;
    this.collectionSubtitle = `COLECCIÓN ${new Date(collection.release_date).getFullYear()}`;
    this.collectionBanner = collection.banner || '';
    this.collectionDescription = collection.description || '';

    const rows = await this.collections.getCollectionItemsByCollectionId(String(collection.id)) as any[];

    /** Cards: solo imagen (no usar URL de video como src de <img>). */
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
        const product = r.products;
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
      .filter(x => x !== null && Boolean(x.slug) && Boolean(x.title)) as CollectionItemCard[];
  }

  trackById(_: number, it: CollectionItemCard) {
    return it.id;
  }
}
