import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronLeft, ChevronRight, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { CollectionService } from '../../../../core/services/data-access/collection/collection.service';
import { CollectionBridesService } from '../../../../core/services/data-access/collection-brides/collection_brides.service';
import { BreadcrumbComponent } from '../../system/breadcrump/breadcrump.component';
import { GenGalleryVanillaComponent } from '../../generic/gen-gallery-vanilla/gen-gallery-vanilla.component';
import { LoaderService } from '../../../../core/services/utils/loader.service';

import { AppMenuItem } from '../../../utils/models/app-menu-item.model';
import { MediaItem } from '../../../utils/models/objectsGallery.model';
import { MediaItemJSONB, ProductVariant } from '../../../utils/models/Products-supabase.interface';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';

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
  imports: [CommonModule, RouterModule, BreadcrumbComponent, GenGalleryVanillaComponent, LucideAngularModule, WordRevealDirective, FadeUpLetterDirective],
  templateUrl: './items-collection.component.html',
  styleUrls: ['./items-collection.component.css'],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronLeft, ChevronRight })
    }
  ]
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

  relatedProducts: any[] = [];
  carouselIndex = 0;
  visibleProducts = 3;
  isBrides = false;

  sectionLabel = 'NOVIAS COLECCIONES';
  backRoute: any[] = ['/novias-colecciones'];

@HostListener('window:resize')
onResize() {
  this.updateVisibleProducts();
}

private updateVisibleProducts() {
  const width = window.innerWidth;
  if (width < 1024) {
    this.visibleProducts = 2;
  }
  else {
    this.visibleProducts = 3;
  }
  if (this.carouselIndex > this.maxIndex) {
    this.carouselIndex = this.maxIndex;
  }
}
  private triggers: ScrollTrigger[] = [];

  constructor(
    private route: ActivatedRoute,
    private bridesProducts: BridesProductsService,
    private collections: CollectionService,
    private collectionBrides: CollectionBridesService,
    private loaderService: LoaderService
  ) {}

  ngOnDestroy(): void {
    this.cleanupTriggers();
  }

  private cleanupTriggers(): void {
    this.triggers.forEach(t => t.kill());
    this.triggers = [];
    ScrollTrigger.getAll().forEach(st => st.kill());
    ScrollTrigger.clearMatchMedia();
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

    const main = this.product.main_image;
    const collectionImages = this.normalizeMedia(this.product.media)
      .filter(m => m.type === 'image' && m.use?.includes('collection'))
      .map(m => m.url);

    this.heroImages = [main, ...collectionImages.slice(0, 2)]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);

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
    this.updateVisibleProducts();
    this.route.paramMap.subscribe(params => {
      this.loaderService.holdLoader();
      this.loadProductData();
    });
  }

  async loadProductData(): Promise<void> {
    const url = this.route.snapshot.url;
    this.isBrides = url.some(seg => seg.path === 'novias-colecciones');

    this.collectionSlug = this.route.snapshot.paramMap.get('collectionSlug') || '';
    this.productSlug = this.route.snapshot.paramMap.get(this.isBrides ? 'productSlug' : 'itemSlug') || '';

    // Resetear estado antes de cargar
    this.product = null;
    this.heroImages = [];
    this.galleryRows = [];
    this.carouselIndex = 0;
    this.cleanupTriggers();

    let row: any = null;

    if (this.isBrides) {
      this.backRoute = ['/novias-colecciones'];
      const res: any = await this.bridesProducts.getProducts(this.productSlug);
      row = Array.isArray(res?.data) ? res.data[0] : res?.data;

      // Cargar info de la colección y productos relacionados
      const collection: any = await this.collectionBrides.getCollectionBridesBySlug(this.collectionSlug);
      if (collection) {
        this.sectionLabel = collection.name;
        const items = await this.collectionBrides.getCollectionBridesItemsByCollectionId(String(collection.id));
        this.relatedProducts = items
          .map((i: any) => i.pbrides_products)
          .filter((p: any) => p && p.slug !== this.productSlug);
      }
    } else {
      this.backRoute = ['/colecciones'];
      const collection: any = await this.collections.getCollectionBySlug(this.collectionSlug);
      if (collection) {
        this.sectionLabel = collection.name;
        const detailRes = await this.collections.getCollectionItemDetail(String(collection.id), this.productSlug);
        row = detailRes?.products;

        // Cargar productos relacionados
        const items = await this.collections.getCollectionItemsByCollectionId(String(collection.id));
        this.relatedProducts = items
          .map((i: any) => i.products)
          .filter((p: any) => p && p.slug !== this.productSlug);
      }
    }

    if (!row) {
      this.loaderService.releaseLoader();
      return;
    }

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

    if (this.isBrides) {
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

    // Preload hero images and related products images
    const preloadUrls = [...this.heroImages];
    const uniqueUrls = Array.from(new Set(preloadUrls)).filter(Boolean);

    this.preloadImages(uniqueUrls).then(() => {
      this.initScroll();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        this.loaderService.releaseLoader();
      }, 50);
    });
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

  ScrollTrigger.matchMedia({

    "(min-width: 1024px)": () => {

      const pinTrigger = ScrollTrigger.create({
        trigger: hero,
        start: "top top+=88",
        end: () => `+=${images.offsetHeight - text.offsetHeight}`,
        pin: text,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });

      this.triggers.push(pinTrigger);
    },

    "(max-width: 1023px)": () => {
    }

  });

  const heroImgs = images.querySelectorAll('.hero-image-reveal');

  heroImgs.forEach((imgNode: Element, i: number) => {
    const img = imgNode as HTMLElement;

    const anim = gsap.fromTo(
      img,
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
        delay: i * 0.4
      }
    );

    if (anim.scrollTrigger) {
      this.triggers.push(anim.scrollTrigger);
    }
  });

  ScrollTrigger.refresh();
}

  get maxIndex(): number {
    return Math.max(0, this.relatedProducts.length - this.visibleProducts);
  }

  next() {
    this.carouselIndex = this.carouselIndex >= this.maxIndex ? 0 : this.carouselIndex + 1;
  }

  prev() {
    this.carouselIndex = this.carouselIndex <= 0 ? this.maxIndex : this.carouselIndex - 1;
  }

  get translate(): string {
    return `translateX(-${this.carouselIndex * (100 / this.visibleProducts)}%)`;
  }

  private preloadImages(urls: string[]): Promise<void[]> {
    if (typeof window === 'undefined') {
      return Promise.resolve([]);
    }
    return Promise.all(
      urls.map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        });
      })
    );
  }
}