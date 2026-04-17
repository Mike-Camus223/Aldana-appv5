import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { gsap } from 'gsap';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { GenGalleryVanillaComponent } from '../../generic/gen-gallery-vanilla/gen-gallery-vanilla.component';
import { MediaItem } from '../../../utils/models/objectsGallery.model';

type BridesProduct = {
  name: string;
  description?: string;
  details?: string;
  slug: string;
  main_image: string;
  additional_images: string[];
  avid?: string;
  variants?: { avid?: string }[];
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
  styleUrl: './items-collection.component.css'
})
export class ItemsCollectionComponent implements OnInit {
  breadcrumbItems: AppMenuItem[] = [];

  collectionSlug = '';
  productSlug = ''; // brides mode
  itemSlug = ''; // collections mode
  mediaSlug: string | null = null;

  product: BridesProduct | null = null;
  collectionItem: CollectionItemDetail | null = null;
  media: MediaItem[] = [];
  openIndex: number | null = null;
  mode: 'brides' | 'collections' = 'brides';
  sectionLabel = 'NOVIAS COLECCIONES';
  backRoute: any[] = ['/novias-colecciones'];

  constructor(
    private el: ElementRef,
    private route: ActivatedRoute,
    private bridesProducts: BridesProductsService,
    private collectionBrides: CollectionBridesService,
    private collections: CollectionService
  ) { }

  async ngOnInit(): Promise<void> {
    const routePath = String(this.route.snapshot.routeConfig?.path || '');
    this.mode = routePath.startsWith('colecciones/') ? 'collections' : 'brides';

    this.collectionSlug = this.route.snapshot.paramMap.get('collectionSlug') || '';
    this.productSlug = this.route.snapshot.paramMap.get('productSlug') || '';
    this.itemSlug = this.route.snapshot.paramMap.get('itemSlug') || '';
    this.mediaSlug = this.route.snapshot.paramMap.get('mediaSlug');

    if (!this.collectionSlug) return;

    if (this.mode === 'collections') {
      this.sectionLabel = 'COLECCIONES';
      this.backRoute = ['/colecciones', this.collectionSlug];

      // 1) colección + item
      const collection = await this.collections.getCollectionBySlug(this.collectionSlug) as any;
      if (!collection?.id) return;

      const item = await this.collections.getCollectionItemDetail(String(collection.id), this.itemSlug) as any;
      if (!item) return;

      const mediaRows = Array.isArray(item?.collection_media_items) ? item.collection_media_items : [];
      const sorted = [...mediaRows].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));

      const mediaItems: MediaItem[] = sorted
        .map((m: any) => {
          const url = String(m?.media_url || '').trim();
          if (!url) return null;
          const type = String(m?.type || 'image') as 'image' | 'video';
          const base: MediaItem = { url, alt: String(m?.alt || item?.title || ''), type, fit: 'cover' };
          if (type === 'video') {
            return { ...base, width: 1280, height: 720, poster: String(m?.poster_url || '').trim() || undefined };
          }
          return base;
        })
        .filter(Boolean) as MediaItem[];

      const hero = mediaItems.find(m => m.type === 'image')?.url || mediaItems[0]?.url || null;

      this.collectionItem = {
        title: String(item?.title || ''),
        subtitle: item?.subtitle ?? null,
        description: item?.description ?? null,
        slug: String(item?.slug || this.itemSlug),
        media: mediaItems,
        heroImage: hero
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

      this.productSlug = this.productSlug || this.itemSlug;
      if (!this.productSlug) return;

      // 1) Obtener producto (por slug)
      const res: any = await this.bridesProducts.getProducts(this.productSlug);
      const row = Array.isArray(res?.data) ? res.data[0] : res?.data;
      if (!row) return;

      this.product = {
        name: row?.name || '',
        description: row?.description || '',
        details: row?.details || '',
        slug: row?.slug || this.productSlug,
        main_image: row?.main_image || '',
        additional_images: row?.additional_images || [],
        avid: row?.avid || '',
        variants: Array.isArray(row?.product_variants) ? row.product_variants : []
      };

      // 2) Breadcrumb (usa colección real si existe)
      let collectionName = this.collectionSlug;
      try {
        const cRes = await this.collectionBrides.getCollectionBridesBySlug(this.collectionSlug) as any;
        const cRow = Array.isArray(cRes) ? cRes[0] : cRes;
        if (cRow?.name) collectionName = String(cRow.name).toUpperCase();
      } catch {
        // ignore
      }

      this.breadcrumbItems = [
        { label: 'INICIO', route: '/home' },
        { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
        { label: collectionName, route: `/novias-colecciones/${this.collectionSlug}` },
        { label: String(this.product.name || '').toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}/${this.product.slug}` },
      ];

      // 3) Media list (imágenes + videos)
      const items: MediaItem[] = [];
      const pushImg = (url?: string) => {
        const u = String(url || '').trim();
        if (!u) return;
        items.push({ url: u, alt: this.product?.name || '', type: 'image', fit: 'cover' });
      };
      const pushVid = (url?: string, poster?: string) => {
        const u = String(url || '').trim();
        if (!u) return;
        items.push({
          url: u,
          alt: this.product?.name || '',
          type: 'video',
          fit: 'cover',
          width: 1280,
          height: 720,
          poster: String(poster || '').trim() || undefined
        });
      };

      pushImg(this.product.main_image);
      (this.product.additional_images || []).forEach(pushImg);

      // video principal
      pushVid(this.product.avid, this.product.main_image);

      // videos por variantes (si existen)
      const variantAvids = (this.product.variants || [])
        .map(v => String(v?.avid || '').trim())
        .filter(Boolean);
      [...new Set(variantAvids)].forEach(v => pushVid(v, this.product?.main_image));

      this.media = items;
    }

    // 4) Deep-link a media (/imagen-1, /video, /video-2)
    this.openIndex = this.resolveOpenIndex(this.mediaSlug, this.media);

    // 5) Animación (mantengo el look & feel que ya tenías)
    queueMicrotask(() => this.playIntro());
  }

  private resolveOpenIndex(mediaSlug: string | null, media: MediaItem[]): number | null {
    if (!mediaSlug) return null;
    if (!media?.length) return null;

    const s = String(mediaSlug).toLowerCase();
    const imgMatch = s.match(/^imagen-(\d+)$/);
    if (imgMatch) {
      const n = Number(imgMatch[1]);
      if (Number.isFinite(n) && n >= 1) return Math.min(media.length - 1, n - 1);
      return null;
    }

    const videoIndices = media
      .map((m, i) => ({ m, i }))
      .filter(x => x.m.type === 'video')
      .map(x => x.i);

    if (s === 'video') return videoIndices[0] ?? null;

    const vidMatch = s.match(/^video-(\d+)$/);
    if (vidMatch) {
      const n = Number(vidMatch[1]);
      if (!Number.isFinite(n) || n < 1) return null;
      return videoIndices[n - 1] ?? null;
    }

    return null;
  }

  private playIntro(): void {
    const root = this.el.nativeElement as HTMLElement;
    const title = root.querySelector('h1');
    const blocks = root.querySelectorAll('p, a, button');
    const mediaEl = root.querySelector('[data-items-collection-hero-media]');

    const tl = gsap.timeline();

    if (title) {
      tl.from(title, { y: 80, opacity: 0, duration: 1, ease: 'power3.out' });
    }

    if (blocks?.length) {
      tl.from(blocks, {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power2.out'
      }, '-=0.6');
    }

    if (mediaEl) {
      tl.from(mediaEl, { scale: 1.06, opacity: 0, duration: 1.0, ease: 'power3.out' }, '-=0.8');
    }
  }
}