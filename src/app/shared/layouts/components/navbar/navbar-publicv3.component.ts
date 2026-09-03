import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import {
  trigger,
  style,
  transition,
  animate
} from '@angular/animations';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { CartItem } from '../../../models/cartItems-model';
import { LinkHoverUnderlineDirective } from '../../../directives/animations/link-hover-underline.directive';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-navbar-publicv3',
  imports: [CommonModule, RouterModule, LinkHoverUnderlineDirective, LucideAngularModule],
  templateUrl: './navbar-publicv3.component.html',
  styleUrl: './navbar-publicv3.component.css', changeDetection: ChangeDetectionStrategy.Eager,
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('sidebarSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('overlayFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('expandDropdown', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('250ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class NavbarPublicv3Component implements OnInit, OnDestroy {
  private isBrowser: boolean;
  private cdr = inject(ChangeDetectorRef);
  private scrollTriggerInstance?: any;
  lastScrollTop = 0;
  showNavbar = true;
  scrollThreshold = 100;
  isHomePage = false;
  isErrorPage = false;
  MoverScroll = false;
  dropdownOpen = false;
  mobileDropdownOpen = false;
  menuOpen = false;
  cartItemCount = 0;
  cartItems: CartItem[] = [];
  hoverNavbar = false;
  isAuthenticated = false;
  private authSubscription: Subscription = new Subscription();

  tiendaItems: { label: string; slug: string }[] = [
    { label: 'New Drop', slug: 'new-drop' },
    { label: 'Novias', slug: 'novias' },
    { label: 'Sastrería', slug: 'sastreria' },
    { label: 'Camperas', slug: 'camperas' },
    { label: 'Accesorios', slug: 'accesorios' },
    { label: 'Pantalones y Faldas', slug: 'pantalones-y-faldas' },
    { label: 'Tops', slug: 'tops' },
    { label: 'Buzos', slug: 'buzos' },
    { label: 'Vestidos y Monos', slug: 'vestidos-y-monos' }
  ];

  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router,
    private cartService: CartService,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageStatus();
        this.menuOpen = false;
        this.dropdownOpen = false;
        this.mobileDropdownOpen = false;
        this.cdr.markForCheck();
      });
  }

  private updatePageStatus(): void {
    const url = (this.router.url || '').split('?')[0].split('#')[0];

    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    const pathConfig = route.routeConfig?.path;
    const isWildcardOrErrorPath = pathConfig === '**' || pathConfig === 'error';
    const isErrorUrl = url === '/error' || url.startsWith('/error');

    this.isErrorPage = isWildcardOrErrorPath || isErrorUrl;
    this.isHomePage = !this.isErrorPage && (url === '/' || url === '/home');
  }

  ngOnInit(): void {
    this.updatePageStatus();

    if (this.isBrowser) {
      gsap.registerPlugin(ScrollTrigger);
      this.scrollTriggerInstance = ScrollTrigger.create({
        onUpdate: (self) => {
          this.handleScrollUpdate(self.scroll());
        }
      });
    }

    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
      this.cdr.markForCheck();
    });

    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.isAuthenticated = !!user;
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
    this.scrollTriggerInstance?.kill();
    if (this.isBrowser && this.menuOpen) {
      document.body.style.overflow = '';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;

    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    this.handleScrollUpdate(currentScroll);
  }

  private handleScrollUpdate(currentScroll: number) {
    if (this.menuOpen || this.dropdownOpen) {
      this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      this.MoverScroll = currentScroll > 10;
      this.cdr.detectChanges();
      return;
    }

    if (currentScroll < this.scrollThreshold) {
      this.showNavbar = true;
    } else if (currentScroll > this.lastScrollTop + 4) {
      this.showNavbar = false;
      this.menuOpen = false;
      if (this.isBrowser) {
        document.body.style.overflow = '';
      }
    } else if (currentScroll < this.lastScrollTop - 4) {
      this.showNavbar = true;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    this.MoverScroll = currentScroll > 10;
    this.cdr.detectChanges();
  }

  onInteractiveEnter() {
    this.hoverNavbar = true;
  }

  onNavbarLeave() {
    // Solo quitar el hover si no estamos en el dropdown
    if (!this.dropdownOpen && this.isHomePage && !this.MoverScroll) {
      this.hoverNavbar = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.isBrowser) return;

    if (
      this.dropdownOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.dropdownOpen = false;
      this.cdr.markForCheck();
    }
  }

  toggleMenu() {
    if (!this.isBrowser) return;

    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) {
      this.mobileDropdownOpen = false;
    }

    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
    this.cdr.markForCheck();
  }

  toggleMobileDropdown() {
    this.mobileDropdownOpen = !this.mobileDropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  onMenuLinkClick() {
    if (!this.isBrowser) return;

    this.menuOpen = false;
    this.dropdownOpen = false;
    this.mobileDropdownOpen = false;
    document.body.style.overflow = '';
  }

  normalizeCategory(item: string | { label: string; slug: string }): string {
    if (typeof item !== 'string') {
      return item?.slug || '';
    }
    return item
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
  }

  goToCategory(item: string | { label: string; slug: string }): void {
    this.closeDropdown();
    this.onMenuLinkClick();
    const slug = typeof item === 'object' ? item.slug : this.normalizeCategory(item);
    this.router.navigate(['/tienda/categoria', slug]);
  }

  onDropdownMouseEnter(): void {
    this.dropdownOpen = true;
  }

  onDropdownMouseLeave(): void {
    this.dropdownOpen = false;
  }

  // --- 3 Estados del Navbar (Home, Normal, Error 404) ---

  // Fondo Desktop
  get desktopNavBgClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return { 'bg-[#FEF2E5] bg-opacity-100': true };
    }
    const isSolid = !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'bg-aldy-white bg-opacity-100': isSolid,
      'bg-transparent': !isSolid
    };
  }

  // Fondo Mobile
  get mobileNavBgClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return { 'bg-[#FEF2E5] shadow-md': true };
    }
    const isSolid = this.menuOpen || !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'bg-aldy-white shadow-md': isSolid,
      'bg-gradient-to-b from-black/35 to-transparent': !isSolid
    };
  }

  // Texto / Links
  get linkTextClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return {
        'text-aldy-medium-2 hover:text-aldy-medium-2 border-aldy-medium-2 hover:border-aldy-medium-2': true
      };
    }
    const isSolid = !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'text-aldy-medium hover:text-aldy-medium-2 border-aldy-medium hover:border-aldy-medium-2': isSolid,
      'text-white hover:text-gray-300 border-white': !isSolid
    };
  }

  // Chevron Tienda
  get chevronColorClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return {
        'text-aldy-medium-2 hover:text-aldy-medium-2': true,
        'rotate-180': this.dropdownOpen
      };
    }
    const isSolid = !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'text-aldy-medium hover:text-aldy-medium-2': isSolid,
      'text-white': !isSolid,
      'rotate-180': this.dropdownOpen
    };
  }

  // Íconos Desktop
  get iconColorClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return { 'text-aldy-medium-2 hover:text-aldy-medium-2': true };
    }
    const isSolid = !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'text-aldy-medium hover:text-aldy-medium-2': isSolid,
      'text-white hover:text-gray-300': !isSolid
    };
  }

  // Íconos Mobile
  get mobileIconColorClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return { 'text-aldy-medium-2 hover:text-aldy-medium-2': true };
    }
    const isSolid = this.menuOpen || !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'text-aldy-medium hover:text-aldy-medium-2': isSolid,
      'text-white': !isSolid
    };
  }

  // Badge Carrito Desktop
  get cartBadgeClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return { 'text-aldy-medium-2 border-aldy-medium-2 hover:border-aldy-medium-2': true };
    }
    const isSolid = !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'text-aldy-medium border-aldy-medium hover:border-aldy-medium-2': isSolid,
      'text-white border-white': !isSolid
    };
  }

  // Badge Carrito Mobile
  get mobileCartBadgeClass(): Record<string, boolean> {
    if (this.isErrorPage) {
      return { 'text-aldy-medium-2': true };
    }
    const isSolid = this.menuOpen || !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return {
      'text-aldy-medium': isSolid,
      'text-white': !isSolid
    };
  }

  // Logo Blanco vs Oscuro
  get isWhiteLogo(): boolean {
    if (this.isErrorPage) return false;
    return this.isHomePage && !this.MoverScroll && !this.hoverNavbar && !this.menuOpen;
  }

  // Color de subrayado en hover
  get underlineDynamicColor(): string {
    if (this.isErrorPage) return '#7a8c6e';
    const isSolid = !this.isHomePage || this.MoverScroll || this.hoverNavbar;
    return isSolid ? 'white' : '#AEC2A9';
  }

  onUserButtonClick(): void {
    this.menuOpen = false;
    this.dropdownOpen = false;
    this.mobileDropdownOpen = false;

    if (this.isBrowser) {
      document.body.style.overflow = '';
    }

    if (this.isAuthenticated) {
      this.router.navigate(['/panel/panel-control']);
    } else {
      this.router.navigate(['/cuenta/iniciar-sesion']);
    }
  }

}
