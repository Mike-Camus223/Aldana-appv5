import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { GenGalleryVanillaComponent } from '../../generic/gen-gallery-vanilla/gen-gallery-vanilla.component';
import { MediaItem } from '../../../utils/models/objectsGallery.model';

import { MediaItemJSONB, ProductVariant } from '../../../utils/models/Products-supabase.interface';
import { ProductUtils } from '../../../utils/dataEx/products-utils';

type BridesProduct = {
  name: string;
  description?: string;
  details?: string;
  slug: string;
  main_image: string;
  media: MediaItemJSONB[];
  avid?: string;
  variants?: ProductVariant[];
};

type CollectionItemDetail = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  slug: string;
  media: MediaItem[];
  heroImage?: string | null;
};

@Component({
  selector: 'app-items-collection',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent, GenGalleryVanillaComponent],
  templateUrl: './items-collection.component.html',
  styleUrls: ['./items-collection.component.css']
})
export class ItemsCollectionComponent implements OnInit {
  breadcrumbItems: AppMenuItem[] = [];

  collectionSlug = '';
  productSlug = '';
  itemSlug = '';
  mediaSlug: string | null = null;

  product: BridesProduct | null = null;
  collectionItem: CollectionItemDetail | null = null;
  media: MediaItem[] = [];
  openIndex: number | null = null;
  mode: 'collections' | 'bridal-item' | 'bridal-product' = 'bridal-product';
  sectionLabel = 'NOVIAS COLECCIONES';
  backRoute: any[] = ['/novias-colecciones'];

  get isItemDetailLayout(): boolean {
    return this.mode === 'collections' || this.mode === 'bridal-item';
  }

  get heroImages(): string[] {
    let images: string[] = [];
    
    if (this.isItemDetailLayout && this.collectionItem) {
      images = this.collectionItem.media
        .filter(m => m.type === 'image')
        .slice(0, 3)
        .map(img => img.url);
    } else if (this.product) {
      if (this.product.main_image) images.push(this.product.main_image);
      const collectionMedia = ProductUtils.getMediaByUse(this.product.media, 'collection')
        .filter(m => m.type === 'image');
      collectionMedia.slice(0, 2).forEach(m => images.push(m.url));
      images = images.slice(0, 3);
    }
    
    // Siempre aseguramos 3 imágenes, duplicando si es necesario
    while (images.length < 3 && images.length > 0) {
      images.push(images[images.length % images.length]);
    }
    
    // Debug: log para verificar
    console.log('Hero images count:', images.length, 'Mode:', this.mode, 'Images:', images);
    
    return images;
  }

  get galleryMedia(): MediaItem[] {
    if (this.isItemDetailLayout && this.collectionItem) {
      return this.collectionItem.media;
    }
    
    if (this.product) {
      const items: MediaItem[] = [];
      const usedUrls = new Set<string>(); // Para evitar duplicados
      
      const pushMedia = (m: MediaItemJSONB) => {
        const u = String(m.url || '').trim();
        if (!u || usedUrls.has(u)) return;
        usedUrls.add(u);
        if (m.type === 'image') {
          items.push({ url: u, alt: this.product?.name || '', type: 'image', fit: 'cover' });
        } else if (m.type === 'video') {
          items.push({ 
            url: u, 
            alt: this.product?.name || '', 
            type: 'video', 
            fit: 'cover', 
            width: 1280, 
            height: 720, 
            poster: String(m.poster || '').trim() || undefined 
          });
        }
      };

      // 1. Media with use: 'collection' from product
      ProductUtils.getMediaByUse(this.product.media, 'collection').forEach(pushMedia);
      
      // 2. Media with use: 'collection' from variants
      (this.product.variants || []).forEach(variant => {
        ProductUtils.getMediaByUse(variant.media, 'collection').forEach(pushMedia);
      });
      
      console.log('Gallery media items:', items.length, 'Unique URLs:', usedUrls.size);
      return items;
    }
    
    return this.media;
  }

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private bridesProducts: BridesProductsService,
    private collectionBrides: CollectionBridesService,
    private collections: CollectionService
  ) {}

  async ngOnInit(): Promise<void> {
    const routePath = String(this.route.snapshot.routeConfig?.path || '');

    this.collectionSlug = this.route.snapshot.paramMap.get('collectionSlug') || '';
    this.productSlug    = this.route.snapshot.paramMap.get('productSlug') || '';
    this.itemSlug       = this.route.snapshot.paramMap.get('itemSlug') || '';
    this.mediaSlug      = this.route.snapshot.paramMap.get('mediaSlug');

    if (!this.collectionSlug) return;

    this.collectionItem = null;
    this.product = null;

    if (routePath.startsWith('colecciones/')) {
      this.mode = 'collections';
      this.sectionLabel = 'COLECCIONES';
      this.backRoute = ['/colecciones', this.collectionSlug];

      const collection = await this.collections.getCollectionBySlug(this.collectionSlug) as any;
      if (!collection?.id) return;

      const slugSeg = this.itemSlug || this.productSlug;
      if (!slugSeg) return;

      const item = await this.collections.getCollectionItemDetail(String(collection.id), slugSeg) as any;
      if (!item) return;

      const mediaRows = Array.isArray(item?.collection_media_items) ? item.collection_media_items : [];
      const sorted = [...mediaRows].sort((a: any, b: any) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
      const mediaItems: MediaItem[] = sorted.map((m: any) => {
        const url = String(m?.media_url || '').trim();
        if (!url) return null;
        const type = String(m?.type || 'image') as 'image' | 'video';
        const base: MediaItem = { url, alt: String(m?.alt || item?.title || ''), type, fit: 'cover' };
        return type === 'video' ? { ...base, width: 1280, height: 720, poster: String(m?.poster_url || '').trim() || undefined } : base;
      }).filter(Boolean) as MediaItem[];

      this.collectionItem = {
        title: String(item?.title || ''),
        subtitle: item?.subtitle ?? null,
        description: item?.description ?? null,
        slug: String(item?.slug || slugSeg),
        media: mediaItems,
        heroImage: mediaItems.find(m => m.type === 'image')?.url || null
      };

      this.breadcrumbItems = [
        { label: 'INICIO', route: '/home' },
        { label: 'COLECCIONES', route: '/colecciones' },
        { label: String(collection?.name || this.collectionSlug).toUpperCase(), route: `/colecciones/${this.collectionSlug}` },
        { label: String(this.collectionItem.title || '').toUpperCase(), route: `/colecciones/${this.collectionSlug}/${this.collectionItem.slug}` },
      ];
      this.media = this.collectionItem.media;

    } else {
      this.sectionLabel = 'NOVIAS COLECCIONES';
      this.backRoute = ['/novias-colecciones', this.collectionSlug];

      const segment = this.productSlug || this.itemSlug;
      if (!segment) return;

      const cRes = await this.collectionBrides.getCollectionBridesBySlug(this.collectionSlug) as any;
      const cRow = Array.isArray(cRes) ? cRes[0] : cRes;
      if (!cRow?.id) return;

      const bridalItem = await this.collectionBrides.getCollectionBridesItemDetail(String(cRow.id), segment);

      if (bridalItem) {
        this.mode = 'bridal-item';

        const mediaRows = Array.isArray(bridalItem?.collection_media_brides_items) ? bridalItem.collection_media_brides_items : [];
        const sorted = [...mediaRows].sort((a: any, b: any) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
        const mediaItems: MediaItem[] = sorted.map((m: any) => {
          const url = String(m?.media_url || '').trim();
          if (!url) return null;
          const type = String(m?.type || 'image') as 'image' | 'video';
          const base: MediaItem = { url, alt: String(m?.alt || bridalItem?.title || ''), type, fit: 'cover' };
          return type === 'video' ? { ...base, width: 1280, height: 720, poster: String(m?.poster_url || '').trim() || undefined } : base;
        }).filter(Boolean) as MediaItem[];

        const collectionName = String(cRow?.name || this.collectionSlug).toUpperCase();

        this.collectionItem = {
          title: String(bridalItem?.title || ''),
          subtitle: bridalItem?.subtitle ?? null,
          description: bridalItem?.description ?? null,
          slug: String(bridalItem?.slug || segment),
          media: mediaItems,
          heroImage: mediaItems.find(m => m.type === 'image')?.url || null
        };

        this.breadcrumbItems = [
          { label: 'INICIO', route: '/home' },
          { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
          { label: collectionName, route: `/novias-colecciones/${this.collectionSlug}` },
          { label: String(this.collectionItem.title || '').toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}/${this.collectionItem.slug}` },
        ];
        this.media = this.collectionItem.media;

      } else {
        this.mode = 'bridal-product';
        this.productSlug = segment;

        const res: any = await this.bridesProducts.getProducts(this.productSlug);
        const row = Array.isArray(res?.data) ? res.data[0] : res?.data;
        if (!row) return;

        this.product = {
          name: row?.name || '',
          description: row?.description || '',
          details: row?.details || '',
          slug: row?.slug || this.productSlug,
          main_image: row?.main_image || '',
          media: Array.isArray(row?.media) ? row.media : [],
          avid: row?.avid || '',
          variants: Array.isArray(row?.product_variants) ? row.product_variants : []
        };

        const collectionName = cRow?.name ? String(cRow.name).toUpperCase() : this.collectionSlug;
        this.breadcrumbItems = [
          { label: 'INICIO', route: '/home' },
          { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
          { label: collectionName, route: `/novias-colecciones/${this.collectionSlug}` },
          { label: String(this.product.name || '').toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}/${this.product.slug}` },
        ];

        this.media = this.galleryMedia;
        this.collectionItem = null;
      }
    }

    this.openIndex = this.resolveOpenIndex(this.mediaSlug, this.media);
  }

  onImageLoad(event: Event, index: number): void {
    console.log(`Hero image ${index + 1} loaded successfully`);
  }

  onImageError(event: Event, index: number): void {
    console.error(`Hero image ${index + 1} failed to load`);
  }

  private resolveOpenIndex(mediaSlug: string | null, media: MediaItem[]): number | null {
    if (!mediaSlug || !media?.length) return null;
    const s = String(mediaSlug).toLowerCase();
    const imgMatch = s.match(/^imagen-(\d+)$/);
    if (imgMatch) {
      const n = Number(imgMatch[1]);
      return Number.isFinite(n) && n >= 1 ? Math.min(media.length - 1, n - 1) : null;
    }
    const videoIndices = media.map((m, i) => ({ m, i })).filter(x => x.m.type === 'video').map(x => x.i);
    if (s === 'video') return videoIndices[0] ?? null;
    const vidMatch = s.match(/^video-(\d+)$/);
    if (vidMatch) {
      const n = Number(vidMatch[1]);
      return (!Number.isFinite(n) || n < 1) ? null : videoIndices[n - 1] ?? null;
    }
    return null;
  }
}