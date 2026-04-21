import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';
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
export class ItemsCollectionComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('stickyText') stickyText!: ElementRef;
  @ViewChild('imagesContainer') imagesContainer!: ElementRef;
  @ViewChild('heroSection') heroSection!: ElementRef;

  breadcrumbItems: AppMenuItem[] = [];

  collectionSlug = '';
  productSlug = '';
  product: BridesProduct | null = null;
  heroImages: string[] = [];
  galleryRows: { label: string; items: MediaItem[] }[] = [];

  sectionLabel = 'NOVIAS COLECCIONES';
  backRoute: any[] = ['/novias-colecciones'];

  private triggers: ScrollTrigger[] = [];

  constructor(
    private route: ActivatedRoute,
    private bridesProducts: BridesProductsService,
    private collections: CollectionService
  ) {}

  ngOnDestroy(): void {
    this.cleanupTriggers();
  }

  private cleanupTriggers(): void {
    this.triggers.forEach(t => t.kill());
    this.triggers = [];
    ScrollTrigger.getAll().forEach(st => st.kill());
  }

  private normalizeMedia(media: any): MediaItemJSONB[] {
    if (!Array.isArray(media)) return [];
    return Array.isArray(media[0]) ? media.flat() : media;
  }

  private updateImagesData(): void {
    if (!this.product) {
      this.heroImages = [];
      this.galleryRows = [];
      return;
    }

    // Actualizar Hero Images
    const main = this.product.main_image;
    const collectionImages = this.normalizeMedia(this.product.media)
      .filter(m => m.type === 'image' && m.use?.includes('collection'))
      .map(m => m.url);

    this.heroImages = [main, ...collectionImages.slice(0, 2)]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Actualizar Gallery Rows
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
        label: i === 0 ? this.product.name : `${this.product.name} (Cont.)`,
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
          label: i === 0 ? `${this.product?.name} - ${v.color_name || idx + 1}` : `${this.product?.name} - ${v.color_name || idx + 1} (Cont.)`,
          items: items.slice(i, i + 5)
        });
      }
    });

    this.galleryRows = rows;
  }

  async ngOnInit(): Promise<void> {
    const url = this.route.snapshot.url;
    const isBrides = url.some(seg => seg.path === 'novias-colecciones');

    this.collectionSlug = this.route.snapshot.paramMap.get('collectionSlug') || '';
    this.productSlug = this.route.snapshot.paramMap.get(isBrides ? 'productSlug' : 'itemSlug') || '';

    let row: any = null;

    if (isBrides) {
      this.sectionLabel = 'NOVIAS COLECCIONES';
      this.backRoute = ['/novias-colecciones'];
      const res: any = await this.bridesProducts.getProducts(this.productSlug);
      row = Array.isArray(res?.data) ? res.data[0] : res?.data;
    } else {
      this.sectionLabel = 'COLECCIONES';
      this.backRoute = ['/colecciones'];
      // Para colecciones normales, primero necesitamos el ID de la colección o usar el slug para buscar el producto
      const collection = await this.collections.getCollectionBySlug(this.collectionSlug);
      if (collection) {
        const detailRes = await this.collections.getCollectionItemDetail(String(collection.id), this.productSlug);
        row = detailRes?.products;
      }
    }

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

    this.updateImagesData();

    if (isBrides) {
      this.breadcrumbItems = [
        { label: 'INICIO', route: '/home' },
        { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
        { label: this.collectionSlug.toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}` },
        { label: this.product.name.toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}/${this.product.slug}` }
      ];
    } else {
      this.breadcrumbItems = [
        { label: 'INICIO', route: '/home' },
        { label: 'COLECCIONES', route: '/colecciones' },
        { label: this.collectionSlug.toUpperCase(), route: `/colecciones/${this.collectionSlug}` },
        { label: this.product.name.toUpperCase(), route: `/colecciones/${this.collectionSlug}/${this.product.slug}` }
      ];
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initScroll();
    }, 500); // Mayor delay para estabilidad
  }

  initScroll() {
    if (!this.stickyText || !this.imagesContainer || !this.heroSection) return;
    
    this.cleanupTriggers();

    const text = this.stickyText.nativeElement;
    const images = this.imagesContainer.nativeElement;
    const hero = this.heroSection.nativeElement;

    // Pinning del texto
    const pinTrigger = ScrollTrigger.create({
      trigger: hero,
      start: "top top+=88",
      end: () => `+=${images.offsetHeight - text.offsetHeight}`,
      pin: text,
      pinSpacing: false,
      invalidateOnRefresh: true,
    });
    this.triggers.push(pinTrigger);

    // Animaciones de las imágenes
    const heroImgs = images.querySelectorAll('.hero-image-reveal');
    heroImgs.forEach((imgNode: Element, i: number) => {
      const img = imgNode as HTMLElement;
      
      const anim = gsap.fromTo(img, 
        { 
          opacity: 0, 
          y: 40,
          clipPath: 'inset(100% 0 0 0)' 
        }, 
        {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: img,
            start: "top 90%",
            toggleActions: "play none none none"
          },
          delay: i * 0.1
        }
      );
      
      if (anim.scrollTrigger) {
        this.triggers.push(anim.scrollTrigger);
      }
    });

    ScrollTrigger.refresh();
  }
  
}