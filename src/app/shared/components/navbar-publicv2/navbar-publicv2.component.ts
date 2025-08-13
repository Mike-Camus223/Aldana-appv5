import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CartItem } from '../../utils/models/cartItems-model';
import { LinkHoverUnderlineDirective } from '../../utils/directives/link-hover-underline.directive';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider
} from 'lucide-angular';

interface RouterlinkNavbar {
  label: string;
  link: string;
}

@Component({
  selector: 'app-navbar-publicv2',
  standalone: true,
  imports: [CommonModule, RouterModule, LinkHoverUnderlineDirective,
    LucideAngularModule
  ],
  templateUrl: './navbar-publicv2.component.html',
  providers: [
  {
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider({
      Search,
      User,
      Heart,
      ShoppingBag,
      Menu
    })
  }
],
  styleUrls: ['./navbar-publicv2.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', animate('250ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ]),
    trigger('expandCollapse', [
      state('void', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('void <=> *', animate('300ms ease'))
    ]),
    trigger('expandDropdown', [
      state('void', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('void <=> *', animate('250ms ease'))
    ])
  ]
})
export class NavbarPublicv2Component implements OnInit, OnDestroy {

  readonly search = Search;


  isHomePage = false;
  MoverScroll = false;
  dropdownOpen = false;
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

  routerLinkNavbar: RouterlinkNavbar[] = [
    { label: 'NOVIAS', link: '/novias-colecciones' },
    { label: 'COLECCIONES', link: '/colecciones' },
    { label: 'CONTACTO', link: '/contacto' },
    { label: 'ACERCA DE MÍ', link: '/acerca-de-mi'}
  ];

  @ViewChild('dropdownRef') dropdownRef!: ElementRef;
  @ViewChild('navbarRef') navbarRef!: ElementRef;

  constructor(private router: Router, private cartService: CartService, private authService: AuthService) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.isHomePage = this.router.url === '/home';
      });
  }

  ngOnInit(): void {
    this.isHomePage = this.router.url === '/home';
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
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.MoverScroll = window.scrollY > 10;
  }

  onInteractiveEnter() {
    this.hoverNavbar = true;
  }

  onNavbarLeave() {
    if (this.isHomePage && !this.MoverScroll) {
      this.hoverNavbar = false;
    }
    this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (
      this.dropdownOpen &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.dropdownOpen = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) this.dropdownOpen = false;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  onMenuLinkClick() {
    this.menuOpen = false;
    this.dropdownOpen = false;
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
      'text-white hover:text-gray-700': this.isHomePage && !active,
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
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/user-panel']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}