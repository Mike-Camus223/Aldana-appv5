import { Component, OnInit, OnDestroy, HostListener, Inject, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { BridesProductsService } from '../../../../core/services/data-access/brides-products/brides-products.service';
import { Product } from '../../../models/Products-supabase.interface';
import { ProductUtils } from '../../../utils/mappers/product.mapper';
import { CardproductComponent } from '../../generic/cardproduct/cardproduct.component';
import { LucideAngularModule } from 'lucide-angular';
import { LoadingbarComponent } from '../../system/loadingbar/loadingbar.component';
import { FavoritesService } from '../../../../core/services/favorites/favorites.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { ProductsService } from '../../../../core/services/data-access/products/products.service';
import { PaginatorComponent } from '../../generic/paginator/paginator.component';
import { FilterComponent } from '../../system/filter/filter.component';
import { NewdropcollectionComponent } from '../../generic/newdropcollection/newdropcollection.component';
import { gsap } from 'gsap';

@Component({
  selector: 'app-store-template',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardproductComponent,
    LucideAngularModule,
    LoadingbarComponent,
    PaginatorComponent,
    FilterComponent,
    NewdropcollectionComponent
  ],
  templateUrl: './store-template.component.html',
  styleUrls: ['./store-template.component.css'],
  changeDetection: ChangeDetectionStrategy.Default})
export class StoreTemplateComponent implements OnInit, OnDestroy {
  filteredProducts: Product[] = [];
  pagedProducts: Product[] = [];
  selectedColors: Record<string, string> = {};

  activeCategory: string = 'new-drop';
  selectedCollectionId: string | null = null;
  totalProductsCount: number = 0;
  newDropCollections: any[] = [];

  loading: boolean = true;
  cardsReady: boolean = false;
  showFilters: boolean = false;
  productColumns: number = 4;
  itemsPerPage: number = 16;
  readonly maxPages: number = 4;
  currentPage: number = 1;
  pagesArray: number[] = [];

  // Collections state
  allCollections: any[] = [];
  allBridesCollections: any[] = [];
  topCollections: any[] = [];
  topBridesCollections: any[] = [];

  isMobileView: boolean = false;
  private currentFavorites: Set<string> = new Set();
  private currentRequestId: number = 0;
  private routeSubscription = new Subscription();
  private hasInitialized = false;

  @ViewChild('productsContainer') productsContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('spinnerContainer') spinnerContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('productsGrid') productsGridRef?: ElementRef<HTMLDivElement>;

  constructor(
    private productsService: ProductsService,
    private bridesProductsService: BridesProductsService,
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.checkMobileView();

    this.routeSubscription.add(
      combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, qp]) => {
        const categoriaParam = params.get('categoria');
        const collectionParam = qp.get('coleccion');
        const pageParam = qp.get('page');

        const resolvedCategory = this.resolveCategorySlug(categoriaParam);
        const resolvedCollection = collectionParam || null;
        const qpPage = pageParam ? Number(pageParam) : 1;
        const resolvedPage = !Number.isNaN(qpPage) && qpPage > 0 ? qpPage : 1;

        if (
          !this.hasInitialized ||
          resolvedCategory !== this.activeCategory ||
          resolvedCollection !== this.selectedCollectionId ||
          resolvedPage !== this.currentPage
        ) {
          this.hasInitialized = true;
          this.activeCategory = resolvedCategory;
          this.selectedCollectionId = resolvedCollection;
          this.currentPage = resolvedPage;
          void this.applyFilters();
        }
      })
    );

    this.routeSubscription.add(
      this.favoritesService.favorites$.subscribe(favorites => {
        if (this.authService.isAuthenticated()) {
          this.currentFavorites = new Set(favorites.map(f => f.product_id));
          this.updateWishlistStatus(this.currentFavorites);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  private resolveCategorySlug(param: string | null): string {
    if (!param) return 'new-drop';
    const lower = param.toLowerCase().trim();
    if (lower === 'vestidos' || lower === 'monos' || lower === 'vestidos-y-monos') return 'vestidos-y-monos';
    if (lower === 'abrigos' || lower === 'campera' || lower === 'camperas') return 'camperas';
    if (lower === 'pantalones' || lower === 'pantalon' || lower === 'faldas' || lower === 'pantalones-y-faldas') return 'pantalones-y-faldas';
    if (lower === 'remeras' || lower === 'camisas' || lower === 'blusas' || lower === 'tops') return 'tops';
    if (lower === 'sastrero' || lower === 'sastreria') return 'sastreria';
    if (lower === 'buzo' || lower === 'buzos') return 'buzos';
    if (lower === 'accesorio' || lower === 'accesorios') return 'accesorios';
    if (lower === 'novia' || lower === 'novias') return 'novias';
    if (lower === 'newdrop' || lower === 'new-drop' || lower === 'todos' || lower === 'general') return 'new-drop';
    return lower;
  }

  private updateWishlistStatus(favoriteIds: Set<string>): void {
    const updateProduct = (p: Product) => {
      p.wishlisted = favoriteIds.has(p.id);
    };
    if (this.filteredProducts) this.filteredProducts.forEach(updateProduct);
    if (this.pagedProducts) this.pagedProducts.forEach(updateProduct);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobileView();
      if (!this.isMobileView && this.showFilters) {
        this.showFilters = false;
      }
    }
  }

  private async ensureCollectionsLoaded(): Promise<void> {
    try {
      if (this.allCollections.length === 0) {
        const collectionsData = await this.productsService.getAllCollections('pret-a-porter');
        this.allCollections = collectionsData || [];
        this.topCollections = [...this.allCollections]
          .sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime())
          .slice(0, 4);
      }
      if (this.allBridesCollections.length === 0) {
        const bridesCollectionsData = await this.productsService.getAllCollections('bridal');
        this.allBridesCollections = bridesCollectionsData || [];
        this.topBridesCollections = [...this.allBridesCollections]
          .sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime())
          .slice(0, 4);
      }
    } catch (err) {
      console.error('Error loading collections cache:', err);
    }
  }

  public async applyFilters(): Promise<void> {
    this.currentRequestId++;
    const requestId = this.currentRequestId;

    if (isPlatformBrowser(this.platformId)) {
      if (this.productsContainerRef?.nativeElement) gsap.killTweensOf(this.productsContainerRef.nativeElement);
      if (this.spinnerContainerRef?.nativeElement) gsap.killTweensOf(this.spinnerContainerRef.nativeElement);
      if (this.productsGridRef?.nativeElement) gsap.killTweensOf(this.productsGridRef.nativeElement);
    }

    let prevHeight = 420;
    if (isPlatformBrowser(this.platformId) && this.productsContainerRef?.nativeElement) {
      prevHeight = Math.max(420, this.productsContainerRef.nativeElement.offsetHeight);
      this.productsContainerRef.nativeElement.style.height = `${prevHeight}px`;
    }

    this.cardsReady = false;
    this.loading = true;
    this.filteredProducts = [];
    this.pagedProducts = [];
    this.newDropCollections = [];
    this.cdr.detectChanges();

    // Fadeup spinner entrance
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        if (this.spinnerContainerRef?.nativeElement) {
          gsap.killTweensOf(this.spinnerContainerRef.nativeElement);
          gsap.fromTo(this.spinnerContainerRef.nativeElement,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }
          );
        }
      }, 0);
    }

    try {
      await Promise.all([
        this.ensureCollectionsLoaded(),
        new Promise(resolve => setTimeout(resolve, 350))
      ]);

      if (requestId !== this.currentRequestId) return;

      let tempFilteredProducts: Product[] = [];
      let tempPagedProducts: Product[] = [];
      let tempNewDropCollections: any[] = [];
      let tempTotalCount = 0;

      if (this.activeCategory === 'new-drop') {
        if (this.currentPage === 1) {
          tempNewDropCollections = [...this.topCollections]
            .sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime())
            .slice(0, 4);
        }

        const normalRes = await this.productsService.getLatestProducts(32, 'pret-a-porter');
        if (requestId !== this.currentRequestId) return;

        const normalProducts = ProductUtils.mapProducts(normalRes.data || [], false);
        tempFilteredProducts = normalProducts;
        tempTotalCount = normalProducts.length;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        tempPagedProducts = tempFilteredProducts.slice(start, end);

      } else if (this.activeCategory === 'novias') {
        if (this.selectedCollectionId === null) {
          tempNewDropCollections = [...this.allBridesCollections]
            .sort((a, b) => new Date(b.release_date || b.created_at).getTime() - new Date(a.release_date || a.created_at).getTime());
          tempFilteredProducts = [];
          tempPagedProducts = [];
          tempTotalCount = 0;
        } else {
          tempNewDropCollections = [];
          const res = await this.productsService.getProductsPaged({
            collectionId: this.selectedCollectionId,
            department: 'bridal',
            page: this.currentPage,
            pageSize: this.itemsPerPage
          });

          if (requestId !== this.currentRequestId) return;

          tempFilteredProducts = ProductUtils.mapProducts(res.data || [], true).map(p => ({
            ...p,
            source_module: 'bridal',
            isBridal: true
          }));
          tempPagedProducts = [...tempFilteredProducts];
          tempTotalCount = res.count || 0;
        }

      } else {
        let categoryDbName: string | undefined;
        let categoryId: number | undefined;

        if (this.activeCategory === 'sastreria' || this.activeCategory === 'sastrero') {
          categoryDbName = 'Sastrería';
          categoryId = 5;
        } else if (this.activeCategory === 'camperas' || this.activeCategory === 'campera') {
          categoryDbName = 'Camperas';
          categoryId = 16;
        } else if (this.activeCategory === 'accesorios') {
          categoryDbName = 'Accesorios';
          categoryId = 9;
        } else if (this.activeCategory === 'pantalones-y-faldas') {
          categoryDbName = 'Pantalones y Faldas';
          categoryId = 4;
        } else if (this.activeCategory === 'tops') {
          categoryDbName = 'Tops';
          categoryId = 2;
        } else if (this.activeCategory === 'buzos') {
          categoryDbName = 'Buzos';
          categoryId = 8;
        } else if (this.activeCategory === 'vestidos-y-monos') {
          categoryDbName = 'Vestidos y Monos';
          categoryId = 6;
        } else if (this.activeCategory === 'otros') {
          categoryDbName = 'Otros';
        }

        const res = await this.productsService.getProductsPaged({
          categoryName: categoryDbName,
          categoryId: categoryId,
          department: 'pret-a-porter',
          page: this.currentPage,
          pageSize: this.itemsPerPage
        });

        if (requestId !== this.currentRequestId) return;

        tempFilteredProducts = ProductUtils.mapProducts(res.data || [], false);
        tempPagedProducts = [...tempFilteredProducts];
        tempTotalCount = res.count || 0;
      }

      if (requestId !== this.currentRequestId) return;

      // Fadedown spinner exit
      if (isPlatformBrowser(this.platformId) && this.spinnerContainerRef?.nativeElement) {
        await new Promise<void>(resolve => {
          gsap.to(this.spinnerContainerRef!.nativeElement, {
            opacity: 0,
            y: 20,
            duration: 0.2,
            ease: 'power2.in',
            overwrite: 'auto',
            onComplete: () => resolve()
          });
        });
      }

      if (requestId !== this.currentRequestId) return;

      this.filteredProducts = tempFilteredProducts;
      this.pagedProducts = tempPagedProducts;
      this.newDropCollections = tempNewDropCollections;
      this.totalProductsCount = tempTotalCount;
      this.loading = false;

      this.pagedProducts.forEach(p => {
        if (!this.selectedColors[p.id]) {
          this.selectedColors[p.id] = p.variants?.[0]?.color_name || '';
        }
      });

      if (this.authService.isAuthenticated()) {
        this.updateWishlistStatus(this.currentFavorites);
      }

      this.updatePagination();
      this.cdr.detectChanges();

      // Smooth layout height growth/shrink animation
      if (isPlatformBrowser(this.platformId) && this.productsContainerRef?.nativeElement) {
        const container = this.productsContainerRef.nativeElement;
        gsap.killTweensOf(container);
        container.style.height = 'auto';
        const targetHeight = Math.max(420, container.offsetHeight);
        container.style.height = `${prevHeight}px`;

        gsap.to(container, {
          height: targetHeight,
          duration: 0.4,
          ease: 'power3.out',
          overwrite: 'auto',
          onComplete: () => {
            if (requestId === this.currentRequestId) {
              container.style.height = 'auto';
              this.cardsReady = true;
              this.cdr.detectChanges();
            }
          }
        });
      } else {
        this.cardsReady = true;
      }

    } catch (err) {
      console.error('Error applying filters:', err);
      this.loading = false;
      this.cardsReady = true;
      if (isPlatformBrowser(this.platformId) && this.productsContainerRef?.nativeElement) {
        this.productsContainerRef.nativeElement.style.height = 'auto';
      }
      this.cdr.detectChanges();
    }
  }

  private updatePagination(): void {
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get totalPages(): number {
    const total = Math.ceil(this.totalProductsCount / this.itemsPerPage);
    return Math.max(1, total);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const url = this.buildUrlString();
    const [base, query] = url.split('?');
    this.location.replaceState(base, query ?? '');
    void this.applyFilters();
  }

  private buildUrlString(): string {
    const path: string[] = ['/tienda'];
    if (this.activeCategory && this.activeCategory !== 'new-drop') {
      path.push('categoria', this.activeCategory);
    }

    const queryParams: Record<string, any> = {};
    if (this.selectedCollectionId) {
      queryParams['coleccion'] = this.selectedCollectionId;
    }
    if (this.currentPage > 1) {
      queryParams['page'] = this.currentPage;
    }

    let base = path.join('/');
    if (!base.startsWith('/')) base = '/' + base;

    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) {
        params.set(k, String(v));
      }
    });
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  applyFiltersAction(isMobile: boolean = false): void {
    this.currentPage = 1;
    const url = this.buildUrlString();
    const [base, query] = url.split('?');
    this.location.replaceState(base, query ?? '');
    void this.applyFilters();
  }

  onCollectionCardSelected(col: any): void {
    const isBridalCol = this.topBridesCollections.some(c => c.id === col.id) || this.allBridesCollections.some(c => c.id === col.id);
    this.activeCategory = isBridalCol ? 'novias' : 'vestidos-y-monos';
    this.selectedCollectionId = col.id;
    this.currentPage = 1;
    this.applyFiltersAction();
  }

  clearFilters(): void {
    this.activeCategory = 'new-drop';
    this.selectedCollectionId = null;
    this.currentPage = 1;

    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.showFilters = false;
    const url = this.buildUrlString();
    const [base, query] = url.split('?');
    this.location.replaceState(base, query ?? '');
    void this.applyFilters();
  }

  selectColor(event: { productId: string; color: string }): void {
    this.selectedColors[event.productId] = event.color;
  }

  toggleFilters(): void {
    if (!isPlatformBrowser(this.platformId) || this.isMobileView) {
      this.showFilters = !this.showFilters;
      return;
    }

    const container = this.productsContainerRef?.nativeElement;
    const prevContainerHeight = container ? container.offsetHeight : 0;

    this.showFilters = !this.showFilters;
    this.cdr.detectChanges();

    if (container && prevContainerHeight) {
      gsap.killTweensOf(container);
      container.style.height = 'auto';
      const targetHeight = container.offsetHeight;
      if (targetHeight !== prevContainerHeight) {
        container.style.height = `${prevContainerHeight}px`;
        gsap.to(container, {
          height: targetHeight,
          duration: 0.45,
          ease: 'power3.out',
          overwrite: 'auto',
          onComplete: () => {
            container.style.height = 'auto';
          }
        });
      }
    }
  }

  setProductColumns(columns: number): void {
    if (this.productColumns === columns) return;
    if (!isPlatformBrowser(this.platformId)) {
      this.productColumns = columns;
      return;
    }

    const grid = this.productsGridRef?.nativeElement;
    const container = this.productsContainerRef?.nativeElement;
    const prevContainerHeight = container ? container.offsetHeight : 0;

    // Change column layout instantly
    this.productColumns = columns;
    this.cdr.detectChanges();

    // Smooth container height transition for luxury responsiveness
    if (container && prevContainerHeight) {
      gsap.killTweensOf(container);
      container.style.height = 'auto';
      const targetHeight = container.offsetHeight;
      if (targetHeight !== prevContainerHeight) {
        container.style.height = `${prevContainerHeight}px`;
        gsap.to(container, {
          height: targetHeight,
          duration: 0.4,
          ease: 'power3.out',
          overwrite: 'auto',
          onComplete: () => {
            container.style.height = 'auto';
          }
        });
      }
    }

    // High-fashion soft editorial micro-reveal (no dark fade, no harsh flash)
    if (grid) {
      const cards = Array.from(grid.children) as HTMLElement[];
      cards.forEach(c => gsap.killTweensOf(c));
      gsap.fromTo(cards,
        { scale: 0.985, y: 10, opacity: 0.9 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.38,
          ease: 'power2.out',
          stagger: 0.015,
          overwrite: 'auto',
          clearProps: 'all'
        }
      );
    }
  }

  private checkMobileView(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth < 1024;
    }
  }
}
