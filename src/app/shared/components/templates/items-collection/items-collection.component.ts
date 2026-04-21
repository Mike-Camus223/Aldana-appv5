import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { GenGalleryVanillaComponent } from '../../generic/gen-gallery-vanilla/gen-gallery-vanilla.component';

import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import { MediaItemJSONB, ProductVariant } from '../../../utils/models/Products-supabase.interface';

gsap.registerPlugin(ScrollTrigger);

type BridesProduct = {
  name: string;
  description?: string;
  slug: string;
  main_image: string;
  media: MediaItemJSONB[];
  variants?: ProductVariant[];
};

@Component({
  selector: 'app-items-collection',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent, GenGalleryVanillaComponent],
  templateUrl: './items-collection.component.html',
})
export class ItemsCollectionComponent implements OnInit, AfterViewInit {

  @ViewChild('stickyText') stickyText!: ElementRef;
  @ViewChild('imagesContainer') imagesContainer!: ElementRef;
  @ViewChild('heroSection') heroSection!: ElementRef;

  breadcrumbItems: AppMenuItem[] = [];

  collectionSlug = '';
  productSlug = '';
  product: BridesProduct | null = null;

  sectionLabel = 'NOVIAS COLECCIONES';
  backRoute: any[] = ['/novias-colecciones'];

  constructor(
    private route: ActivatedRoute,
    private bridesProducts: BridesProductsService
  ) {}

  private normalizeMedia(media: any): MediaItemJSONB[] {
    if (!Array.isArray(media)) return [];
    return Array.isArray(media[0]) ? media.flat() : media;
  }

  get heroImages(): string[] {
    if (!this.product) return [];

    const main = this.product.main_image;

    const collectionImages = this.normalizeMedia(this.product.media)
      .filter(m => m.type === 'image' && m.use?.includes('collection'))
      .map(m => m.url);

    return [main, ...collectionImages]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 6);
  }

  get galleryRows(): { label: string; items: MediaItem[] }[] {
    if (!this.product) return [];

    const rows: { label: string; items: MediaItem[] }[] = [];
    const used = new Set<string>();

    const map = (m: MediaItemJSONB): MediaItem => ({
      url: m.url,
      type: m.type,
      poster: m.poster,
      alt: this.product?.name,
      fit: 'cover'
    });

    const base = this.normalizeMedia(this.product.media)
      .filter(m => m.use?.includes('collection'))
      .filter(m => {
        if (used.has(m.url)) return false;
        used.add(m.url);
        return true;
      })
      .map(map);

    for (let i = 0; i < base.length; i += 5) {
      rows.push({
        label: i === 0 ? 'Producto Principal' : 'Producto Principal (Cont.)',
        items: base.slice(i, i + 5)
      });
    }

    (this.product.variants || []).forEach((v, idx) => {
      const media = this.normalizeMedia(v.media);

      const items = media
        .filter(m => m.use?.includes('collection'))
        .filter(m => {
          if (used.has(m.url)) return false;
          used.add(m.url);
          return true;
        })
        .map(map);

      for (let i = 0; i < items.length; i += 5) {
        rows.push({
          label: `Variante: ${v.color_name || idx + 1}`,
          items: items.slice(i, i + 5)
        });
      }
    });

    return rows;
  }

  async ngOnInit(): Promise<void> {
    this.collectionSlug = this.route.snapshot.paramMap.get('collectionSlug') || '';
    this.productSlug = this.route.snapshot.paramMap.get('productSlug') || '';

    const res: any = await this.bridesProducts.getProducts(this.productSlug);
    const row = Array.isArray(res?.data) ? res.data[0] : res?.data;

    if (!row) return;

    this.product = {
      name: row.name,
      description: row.description,
      slug: row.slug,
      main_image: row.main_image,
      media: this.normalizeMedia(row.media),
      variants: (row.product_variants || []).map((v: any) => ({
        ...v,
        media: this.normalizeMedia(v.media)
      }))
    };

    this.breadcrumbItems = [
      { label: 'INICIO', route: '/home' },
      { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
      { label: this.collectionSlug.toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}` },
      { label: this.product.name.toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}/${this.product.slug}` }
    ];
  }

  ngAfterViewInit(): void {
    // Espera render completo + imágenes
    setTimeout(() => {
      this.initScroll();
    }, 50);
  }

  initScroll() {
  const text = this.stickyText.nativeElement;
  const images = this.imagesContainer.nativeElement;
  const hero = this.heroSection.nativeElement;

  ScrollTrigger.killAll();

  ScrollTrigger.create({
    trigger: hero,
    start: "top top+=88",
    end: () => `+=${images.offsetHeight - text.offsetHeight}`,
    pin: text,
    pinSpacing: false,
    invalidateOnRefresh: true,
  });

  ScrollTrigger.refresh();
}
  
}