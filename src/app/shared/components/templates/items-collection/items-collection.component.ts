import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule, ChevronLeft, ChevronRight, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';

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
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    GenGalleryVanillaComponent,
    LucideAngularModule,
    WordRevealDirective,
    FadeUpLetterDirective,
    CardInitAnimationDirective
  ],
  templateUrl: './items-collection.component.html',
  styleUrls: ['./items-collection.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  private destroy$ = new Subject<void>();
  private triggers: ScrollTrigger[] = [];
  private isBrowser: boolean;

  @HostListener('window:resize')
  onResize() {
    this.updateVisibleProducts();
    if (this.isBrowser) {
      setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }, 100);
    }
  }

  private updateVisibleProducts() {
    if (!this.isBrowser) return;
    const width = window.innerWidth;
    if (width < 1024) {
      this.visibleProducts = 2;
    } else {
      this.visibleProducts = 3;
    }
    if (this.carouselIndex > this.maxIndex) {
      this.carouselIndex = this.maxIndex;
    }
  }

  constructor(
    private route: ActivatedRoute,
    private bridesProducts: BridesProductsService,
    private collections: CollectionService,
    private collectionBrides: CollectionBridesService,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.updateVisibleProducts();

    // Sincronización estricta: SOLO animar cuando el loader ha terminado completamente
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        if (enabled && this.product && this.isBrowser) {
          setTimeout(() => {
            this.initScroll();
            this.cdr.detectChanges();
          }, 80);
        }
      });

    // Carga de producto en cambio de ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loaderService.holdLoader();
        this.loadProductData();
      });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.setupInitialHeroImagesState();
      }, 50);
    }
  }

  ngOnDestroy(): void {
    this.cleanupTriggers();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cleanupTriggers(): void {
    this.triggers.forEach(t => t.kill());
    this.triggers = [];
    if (this.isBrowser && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(st => st.kill());
    }
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
    this.cdr.detectChanges();

    let row: any = null;

    try {
      if (this.isBrides) {
        this.backRoute = ['/novias-colecciones'];
        const res: any = await this.bridesProducts.getProducts(this.productSlug);
        row = Array.isArray(res?.data) ? res.data[0] : res?.data;

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

          const items = await this.collections.getCollectionItemsByCollectionId(String(collection.id));
          this.relatedProducts = items
            .map((i: any) => i.products)
            .filter((p: any) => p && p.slug !== this.productSlug);
        }
      }
    } catch (error) {
      console.error('Error cargando datos del producto:', error);
    }

    if (!row) {
      this.loaderService.releaseLoader();
      this.cdr.detectChanges();
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
        { label: 'INICIO', route: '/' },
        { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' },
        { label: this.collectionSlug.toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}` },
        { label: this.product.name.toUpperCase(), route: `/novias-colecciones/${this.collectionSlug}/${this.product.slug}` }
      ];
    } else {
      this.breadcrumbItems = [
        { label: 'INICIO', route: '/' },
        { label: 'COLECCIONES', route: '/colecciones' },
        { label: this.collectionSlug.toUpperCase(), route: `/colecciones/${this.collectionSlug}` },
        { label: this.product.name.toUpperCase(), route: `/colecciones/${this.collectionSlug}/${this.product.slug}` }
      ];
    }

    this.cdr.detectChanges();

    // Preload hero images
    const preloadUrls = [...this.heroImages];
    const uniqueUrls = Array.from(new Set(preloadUrls)).filter(Boolean);

    this.preloadImages(uniqueUrls).then(() => {
      this.cdr.detectChanges();
      if (this.isBrowser) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        this.setupInitialHeroImagesState();
      }
      setTimeout(() => {
        this.loaderService.releaseLoader();
        this.cdr.detectChanges();
      }, 50);
    });
  }

  private setupInitialHeroImagesState(): void {
    if (!this.isBrowser || !this.imagesContainer) return;
    const heroImgs = this.imagesContainer.nativeElement.querySelectorAll('.hero-image-reveal');
    heroImgs.forEach((imgNode: Element) => {
      const img = imgNode as HTMLElement;
      gsap.killTweensOf(img);
      gsap.set(img, {
        opacity: 0,
        y: 35,
        clipPath: 'inset(100% 0 0 0)',
        willChange: 'transform, opacity, clip-path'
      });
    });
  }

  initScroll(): void {
    if (!this.isBrowser) return;
    if (!this.stickyText || !this.imagesContainer || !this.heroSection) return;

    this.cleanupTriggers();

    const text = this.stickyText.nativeElement;
    const images = this.imagesContainer.nativeElement;
    const hero = this.heroSection.nativeElement;

    // Pinning sticky text
    ScrollTrigger.matchMedia({
      "(min-width: 1024px)": () => {
        const pinTrigger = ScrollTrigger.create({
          trigger: hero,
          start: "top top+=88",
          end: () => `+=${Math.max(0, images.offsetHeight - text.offsetHeight)}`,
          pin: text,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });

        this.triggers.push(pinTrigger);
      },
      "(max-width: 1023px)": () => {}
    });

    const heroImgs = images.querySelectorAll('.hero-image-reveal');

    heroImgs.forEach((imgNode: Element, i: number) => {
      const img = imgNode as HTMLElement;
      gsap.killTweensOf(img);

      if (i === 0) {
        // Primera imagen del hero: se anima con entrada fluida inmediatamente tras salir el loader
        gsap.fromTo(
          img,
          {
            opacity: 0,
            y: 35,
            clipPath: 'inset(100% 0 0 0)'
          },
          {
            opacity: 1,
            y: 0,
            clipPath: 'inset(0% 0 0 0)',
            duration: 1.3,
            ease: 'power2.out',
            delay: 0.05,
            onComplete: () => {
              img.style.clipPath = 'none';
              img.style.opacity = '1';
              img.style.transform = 'none';
              img.style.willChange = 'auto';
            }
          }
        );
      } else {
        // Imágenes subsiguientes (2, 3, etc.): se animan PROGRESIVAMENTE con el scroll del usuario
        gsap.set(img, {
          opacity: 0,
          y: 40,
          clipPath: 'inset(100% 0 0 0)',
          willChange: 'transform, opacity, clip-path'
        });

        const anim = gsap.to(img, {
          opacity: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: img,
            start: "top 85%",
            once: true,
            toggleActions: "play none none none"
          },
          onComplete: () => {
            img.style.clipPath = 'none';
            img.style.opacity = '1';
            img.style.transform = 'none';
            img.style.willChange = 'auto';
          }
        });

        if (anim.scrollTrigger) {
          this.triggers.push(anim.scrollTrigger);
        }
      }
    });

    setTimeout(() => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }, 150);
  }

  get maxIndex(): number {
    return Math.max(0, this.relatedProducts.length - this.visibleProducts);
  }

  next() {
    this.carouselIndex = this.carouselIndex >= this.maxIndex ? 0 : this.carouselIndex + 1;
    this.cdr.detectChanges();
  }

  prev() {
    this.carouselIndex = this.carouselIndex <= 0 ? this.maxIndex : this.carouselIndex - 1;
    this.cdr.detectChanges();
  }

  get translate(): string {
    return `translateX(-${this.carouselIndex * (100 / this.visibleProducts)}%)`;
  }

  private preloadImages(urls: string[]): Promise<void[]> {
    if (!this.isBrowser) {
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