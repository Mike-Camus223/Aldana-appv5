import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  Inject
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
import { CartItem } from '../../../utils/models/cartItems-model';
import { LinkHoverUnderlineDirective } from '../../../utils/directives/link-hover-underline.directive';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider
} from 'lucide-angular';

interface RouterlinkNavbar {
  label: string;
  link: string;
}

@Component({
  selector: 'app-navbar-publicv3',
  imports: [CommonModule, RouterModule, LinkHoverUnderlineDirective, LucideAngularModule],
  templateUrl: './navbar-publicv3.component.html',
  styleUrl: './navbar-publicv3.component.css',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Search,
        User,
        Heart,
        ShoppingBag,
        Menu,
        X,
        ChevronDown
      })
    }
  ],
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
  lastScrollTop = 0;
  showNavbar = true;
  scrollThreshold = 100;
  isHomePage = false;
  MoverScroll = false;
  dropdownOpen = false;
  mobileDropdownOpen = false;
  menuOpen = false;
  cartItemCount = 0;
  cartItems: CartItem[] = [];
  hoverNavbar = false;
  isAuthenticated = false;
  private authSubscription: Subscription = new Subscription();

  tiendaItems = [
    'Camisas',
    'Blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos',
    'Remeras'
  ];

  navLinks: RouterlinkNavbar[] = [
    { label: 'NOVIAS', link: '/novias-colecciones' },
    { label: 'COLECCIONES', link: '/colecciones' },
    { label: 'CONTACTO', link: '/contacto' },
    { label: 'ACERCA DE MÍ', link: '/acerca-de-mi' }
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
        this.isHomePage = this.router.url === '/' || this.router.url === '/home';
        this.menuOpen = false;
        this.dropdownOpen = false;
        this.mobileDropdownOpen = false;
      });
  }

  ngOnInit(): void {
    this.isHomePage = this.router.url === '/' || this.router.url === '/home';
    
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    });

    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.isAuthenticated = !!user;
      })
    );
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe();
    if (this.isBrowser && this.menuOpen) {
      document.body.style.overflow = '';
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;

    const currentScroll = window.scrollY || document.documentElement.scrollTop;

    // Si el dropdown está abierto, no ocultar el navbar
    if (this.dropdownOpen) {
      this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
      this.MoverScroll = currentScroll > 10;
      return;
    }

    if (currentScroll < this.scrollThreshold) {
      this.showNavbar = true;
    } else if (currentScroll > this.lastScrollTop) {
      this.showNavbar = false;
      this.menuOpen = false;
      if (this.isBrowser) {
        document.body.style.overflow = '';
      }
    } else if (currentScroll < this.lastScrollTop) {
      this.showNavbar = true;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    this.MoverScroll = currentScroll > 10;
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
    }
  }

  toggleMenu() {
    if (!this.isBrowser) return;

    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) {
      this.mobileDropdownOpen = false;
    }
    
    document.body.style.overflow = this.menuOpen ? 'hidden' : '';
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

  normalizeCategory(item: string): string {
    return item
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  goToCategory(item: string): void {
    this.closeDropdown();
    this.onMenuLinkClick();
    this.router.navigate(['/tienda/categoria', this.normalizeCategory(item)]);
  }

  get iconColorClass(): Record<string, boolean> {
    const active = this.isHomePage ? this.MoverScroll || this.hoverNavbar : true;

    return {
      'text-white hover:text-gray-300': this.isHomePage && !active,
      'text-aldy-primary-400 hover:text-aldy-primary-500': !this.isHomePage || active
    };
  }

  onDropdownMouseEnter() {
    this.dropdownOpen = true;
  }

  onDropdownMouseLeave() {
    this.dropdownOpen = false;
  }

  onUserButtonClick(): void {
    // Cerrar todos los menús desplegables
    this.menuOpen = false;
    this.dropdownOpen = false;
    this.mobileDropdownOpen = false;
    
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }

    // Navegar según el estado de autenticación
    if (this.isAuthenticated) {
      // Usuario autenticado
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin/home']);
      } else {
        this.router.navigate(['/panel/panel-control']);
      }
    } else {
      // Usuario no autenticado
    this.router.navigate(['/cuenta/iniciar-sesion']);
    }
  }

  get leftLinks(): RouterlinkNavbar[] {
    return this.navLinks.slice(0, 2);
  }

  get rightLinks(): RouterlinkNavbar[] {
    return this.navLinks.slice(2);
  }
}