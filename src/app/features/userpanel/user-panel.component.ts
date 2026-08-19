import {
  Component,
  OnInit,
  inject,
  OnDestroy,
  AfterViewInit,
  PLATFORM_ID,
  Inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AppMenuItem } from '../../shared/utils/models/app-menu-item.model';
import { Heart, House, LogOut, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Package, UserRound } from 'lucide-angular';
import { LoaderService } from '../../core/services/utils/loader.service';
import { NavbarPublicv3Component } from '../../shared/components/system/navbar-publicv3/navbar-publicv3.component';
import { SmoothScrollService } from '../../core/services/utils/smooth-scroll.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, NavbarPublicv3Component],
  templateUrl: './user-panel.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        UserRound,
        Package,
        LogOut,
        Heart,
        House
      })
    }
  ],
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('panelContainer') panelContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('panelAside') panelAside!: ElementRef<HTMLElement>;

  currentUser: User | null = null;
  activeSection: string = 'panel-control';
  isLoading = false;
  private authSubscription?: Subscription;
  private triggers: ScrollTrigger[] = [];

  breadcrumbItemsAccount: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'MI CUENTA', route: '/panel/panel-control' }
  ];

  navItems = [
    {
      title: 'Panel de Control',
      icon: 'house',
      route: 'panel-control'
    },
    {
      title: 'Información Personal',
      icon: 'user-round',
      route: 'informacion-cuenta'
    },
    {
      title: 'Mis Órdenes',
      icon: 'package',
      route: 'orders-history'
    },
    {
      title: 'Favoritos',
      icon: 'heart',
      route: 'favoritos'
    },
  ];

  private authService = inject(AuthService);
  private router = inject(Router);
  private loaderService = inject(LoaderService);
  private smoothScroll = inject(SmoothScrollService);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.updateActiveSectionFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter(event =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        )
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.updateActiveSectionFromUrl(event.url);
          this.isLoading = true;
          return;
        }

        if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          this.updateActiveSectionFromUrl(this.router.url);
          this.isLoading = false;
          this.smoothScroll.refresh();
        }
      });
  }

  private updateActiveSectionFromUrl(url: string): void {
    if (!url) return;
    const found = this.navItems.find(item => url.includes(item.route));
    if (found) {
      this.activeSection = found.route;
    }
  }

  private pinTrigger?: ScrollTrigger;
  private resizeObserver?: ResizeObserver;

  ngOnInit(): void {
    this.loaderService.setContext('user-panel');
    this.updateActiveSectionFromUrl(this.router.url);

    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.smoothScroll.ensureSmoother();
    setTimeout(() => {
      this.initPin();
      this.smoothScroll.refresh();
    }, 200);

    if (this.isBrowser && typeof ResizeObserver !== 'undefined' && this.panelContainer) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.pinTrigger) {
          ScrollTrigger.refresh();
        }
      });
      this.resizeObserver.observe(this.panelContainer.nativeElement);
    }
  }

  private initPin(): void {
    if (!this.isBrowser || !this.panelAside || !this.panelContainer) return;

    if (this.pinTrigger) {
      ScrollTrigger.refresh();
      return;
    }

    const aside = this.panelAside.nativeElement;
    const container = this.panelContainer.nativeElement;

    const getTopOffset = () => window.innerWidth >= 1024 ? 80 : 72;

    this.pinTrigger = ScrollTrigger.create({
      trigger: container,
      start: () => `top top+=${getTopOffset()}`,
      end: () => `+=${Math.max(0, container.offsetHeight - aside.offsetHeight)}`,
      pin: aside,
      pinSpacing: false,
      invalidateOnRefresh: true
    });

    ScrollTrigger.refresh();
  }

  ngOnDestroy() {
    this.loaderService.setContext('public');
    this.authSubscription?.unsubscribe();
    this.resizeObserver?.disconnect();
    this.pinTrigger?.kill();
  }

  onSignOut() {
    this.authService.signOut();
  }
}