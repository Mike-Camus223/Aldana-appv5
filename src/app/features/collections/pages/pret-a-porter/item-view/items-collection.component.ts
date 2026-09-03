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
  inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { BridesProductsService } from '../../../services/brides-products.service';
import { CollectionService } from '../../../services/pret-a-porter.service';
import { CollectionBridesService } from '../../../services/brides-collections.service';
import { BreadcrumbComponent } from '../../../../../shared/components/system/breadcrump/breadcrump.component';
import { GenGalleryVanillaComponent } from '../../../../../shared/components/generic/gen-gallery-vanilla/gen-gallery-vanilla.component';
import { LoaderService } from '../../../../../core/services/loader.service';

import { AppMenuItem } from '../../../../../shared/models/app-menu-item.model';
import { MediaItem } from '../../../../../shared/models/objectsGallery.model';
import { MediaItemJSONB, ProductVariant } from '../../../../../shared/models/Products-supabase.interface';
import { WordRevealDirective } from '../../../../../shared/directives/animations/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../../../shared/directives/animations/fadeupletter.directive';
import { CardInitAnimationDirective } from '../../../../../shared/directives/animations/card-init-animation.directive';

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
  changeDetection: ChangeDetectionStrategy.Eager})
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
  private animationsEnabled = false;
  private isScrollInitialized = false;

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

  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private bridesProducts: BridesProductsService,
    private collections: CollectionService,
    private collectionBrides: CollectionBridesService,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private checkAndInitScroll(): void {
    if (!this.isBrowser) return;
    if (this.animationsEnabled && this.product && !this.isScrollInitialized) {
      this.isScrollInitialized = true;
      setTimeout(() => {
        this.initScroll();
        this.cdr.detectChanges();
      }, 50);
    }
  }

  ngOnInit(): void {
    this.updateVisibleProducts();

    // Sincronización estricta: SOLO animar cuando el loader ha terminado completamente
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        this.animationsEnabled = enabled;
        if (enabled) {
          this.checkAndInitScroll();
        }
      });

    // Carga de producto en cambio de ruta
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loaderService.holdLoader();
        this.isScrollInitialized = false;
        this.loadProductData();
      });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        if (this.product) {
          this.initScroll();
        }
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
    const allMedia = this.normalizeMedia(this.product.media);
    
    // Si hay medios con use 'collection', priorizarlos; si no, usar todos los medios disponibles del producto
    const collectionMedia = allMedia.filter(m => Array.isArray(m.use) && m.use.includes('collection'));
    const mediaPool = collectionMedia.length > 0 ? collectionMedia : allMedia;

    const collectionImages = mediaPool
      .filter(m => m.type === 'image' || !m.type)
      .map(m => m.url);

    // Hero images: máximo 3 imágenes para el bloque del hero
    const combinedHero = [main, ...collectionImages];
    this.heroImages = combinedHero
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 3);

    const rows: { label: string; items: MediaItem[] }[] = [];
    const used = new Set<string>();

    const map = (m: MediaItemJSONB): MediaItem => ({
      url: m.url,
      type: m.type || 'image',
      poster: m.poster,
      alt: this.product?.name,
      fit: 'cover'
    });

    const base = mediaPool
      .filter(m => {
        if (!m?.url || used.has(m.url)) return false;
        used.add(m.url);
        return true;
      })
      .map(map);

    for (let i = 0; i < base.length; i += 5) {
      rows.push({
        label: i === 0 ? (this.product.name || 'Galería') : `${this.product.name} (Cont.)`,
        items: base.slice(i, i + 5)
      });
    }

    (this.product.variants || []).forEach((v, idx) => {
      const vMedia = this.normalizeMedia(v.media);
      const vColl = vMedia.filter(m => Array.isArray(m.use) && m.use.includes('collection'));
      const vPool = vColl.length > 0 ? vColl : vMedia;

      const items = vPool
        .filter(m => {
          if (!m?.url || used.has(m.url)) return false;
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
        this.backRoute = ['/pret-a-porter'];
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
        { label: 'PRÊT-À-PORTER', route: '/pret-a-porter' },
        { label: this.collectionSlug.toUpperCase(), route: `/pret-a-porter/${this.collectionSlug}` },
        { label: this.product.name.toUpperCase(), route: `/pret-a-porter/${this.collectionSlug}/${this.product.slug}` }
      ];
    }

    this.cdr.detectChanges();

    const preloadUrls = [...this.heroImages];
    const uniqueUrls = Array.from(new Set(preloadUrls)).filter(Boolean);

    this.preloadImages(uniqueUrls).then(() => {
      this.cdr.detectChanges();
      this.loaderService.releaseLoader();

      if (this.isBrowser) {
        setTimeout(() => {
          this.initScroll();
          this.cdr.detectChanges();
        }, 80);
      }
    });
  }

  initScroll(): void {
    if (!this.isBrowser) return;
    if (!this.imagesContainer || !this.heroSection) return;

    this.cleanupTriggers();

    const images = this.imagesContainer.nativeElement;
    const hero = this.heroSection.nativeElement;
    const text = this.stickyText?.nativeElement;

    // Pinning sticky text si está presente
    if (text) {
      ScrollTrigger.matchMedia({
        "(min-width: 1024px)": () => {
          const pinTrigger = ScrollTrigger.create({
            trigger: hero,
            start: "top top+=88",
            end: () => `+=${Math.max(0, images.offsetHeight - text.offsetHeight)}`,
            pin: text,
            pinSpacing: false,
            invalidateOnRefresh: true
          });

          this.triggers.push(pinTrigger);
        },
        "(max-width: 1023px)": () => {}
      });
    }

    const heroImgs = images.querySelectorAll('.hero-image-reveal');

    heroImgs.forEach((imgNode: Element, i: number) => {
      const img = imgNode as HTMLElement;
      gsap.killTweensOf(img);

      if (i === 0) {
        // Primera imagen del hero: se anima con entrada fluida inmediatamente
        gsap.fromTo(
          img,
          {
            opacity: 0,
            y: 35,
            clipPath: 'inset(100% 0% 0% 0%)'
          },
          {
            opacity: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.2,
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
        // Imágenes subsiguientes (2, 3): se animan progresivamente con el scroll del usuario
        const anim = gsap.fromTo(
          img,
          {
            opacity: 0,
            y: 40,
            clipPath: 'inset(100% 0% 0% 0%)'
          },
          {
            opacity: 1,
            y: 0,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.1,
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
          }
        );

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