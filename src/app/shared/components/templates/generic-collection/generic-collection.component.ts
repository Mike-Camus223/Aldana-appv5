import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BettercustomDualComponent } from '../../generic/bettercustom-dual/bettercustom-dual.component';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { ProductUtils } from '../../../utils/dataEx/products-utils';

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
  imports: [CommonModule, RouterModule, BettercustomDualComponent, BreadcrumbComponent],
  templateUrl: './generic-collection.component.html',
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
      { label: 'INICIO', route: '/home' },
      { label: 'COLECCIONES', route: '/colecciones' },
      { label: collection.name.toUpperCase(), route: `/colecciones/${slug}` }
    ];

    this.collectionTitle = collection.name;
    this.collectionSubtitle = `- COLECCIÓN ${new Date(collection.release_date).getFullYear()}`;
    this.collectionBanner = collection.banner || '';
    this.collectionDescription = collection.description || '';

    const rows = await this.collections.getCollectionItemsByCollectionId(String(collection.id)) as any[];

    /** Cards: solo imagen (no usar URL de video como src de <img>). */
    const pickThumbFromMedia = (mediaItems: any[] | undefined | null): string | null => {
      const m = Array.isArray(mediaItems) ? mediaItems : [];
      const sorted = [...m].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
      const firstImage = sorted.find(x => String(x?.type) === 'image');
      return String(firstImage?.media_url || '').trim() || null;
    };

    const productIds = [
      ...new Set(
        (Array.isArray(rows) ? rows : [])
          .map((r: any) => r?.product_id)
          .filter((id: unknown) => id != null && String(id).length > 0)
          .map((id: unknown) => String(id))
      )
    ];

    let thumbByProductId = new Map<string, string>();
    if (productIds.length) {
      const raw = await this.supabase.getProductsByIds(productIds);
      const mapped = ProductUtils.mapProducts(raw);
      thumbByProductId = new Map(mapped.map(p => [p.id, p.main_image]));
    }

    this.items = (Array.isArray(rows) ? rows : [])
      .map((r: any) => ({
        id: String(r?.id || ''),
        slug: String(r?.slug || ''),
        title: String(r?.title || ''),
        subtitle: r?.subtitle ?? null,
        description: r?.description ?? null,
        thumbUrl: r?.product_id
          ? (thumbByProductId.get(String(r.product_id)) || pickThumbFromMedia(r?.collection_media_items))
          : pickThumbFromMedia(r?.collection_media_items),
      }))
      .filter(x => Boolean(x.slug) && Boolean(x.title));
  }

  trackById(_: number, it: CollectionItemCard) {
    return it.id;
  }
}
