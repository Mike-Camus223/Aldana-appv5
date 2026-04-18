import { Component, OnInit } from '@angular/core';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BettercustomDualComponent } from '../../generic/bettercustom-dual/bettercustom-dual.component';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { CommonModule } from '@angular/common';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { BridesProductUtils } from '../../../utils/dataEx/brides-products-utils';

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
  imports: [CommonModule, RouterModule, BettercustomDualComponent, BreadcrumbComponent],
  templateUrl: './generic-collection-brides.component.html',
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
      { label: 'INICIO', route: '/home' },
      { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
      { label: String(col.name || '').toUpperCase(), route: `/novias-colecciones/${slug}` }
    ];

    this.collectionTitle = col.name;
    this.collectionSubtitle = `- COLECCIÓN ${new Date(col.release_date).getFullYear()}`;
    this.collectionBanner = col.banner || '';
    this.collectionDescription = col.description || '';

    const rows = await this.getData.getCollectionBridesItemsByCollectionId(String(col.id)) as any[];

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
      const raw = await this.bridesProducts.getProductsByIds(productIds);
      thumbByProductId = new Map(
        raw.map((p: any) => [String(p.id), BridesProductUtils.displayMainImage(p)])
      );
    }

    this.items = (Array.isArray(rows) ? rows : [])
      .map((r: any) => ({
        id: String(r?.id || ''),
        slug: String(r?.slug || ''),
        title: String(r?.title || ''),
        subtitle: r?.subtitle ?? null,
        description: r?.description ?? null,
        thumbUrl: r?.product_id
          ? (thumbByProductId.get(String(r.product_id)) || pickThumbFromMedia(r?.collection_media_brides_items))
          : pickThumbFromMedia(r?.collection_media_brides_items),
      }))
      .filter(x => Boolean(x.slug) && Boolean(x.title));
  }

  trackById(_: number, it: BridesCollectionItemCard) {
    return it.id;
  }
}
