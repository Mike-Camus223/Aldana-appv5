import {
  Component,
  OnInit,
  inject,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('asidePanel') asidePanelRef?: ElementRef;
  @ViewChild('panelContainer') panelContainerRef?: ElementRef;

  currentUser: User | null = null;
  activeSection: string = 'control-panel';
  isLoading = false;
  private pinTrigger?: ScrollTrigger;
  private authSubscription?: Subscription;

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
          this.isLoading = true;
          return;
        }

        if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          setTimeout(() => {
            this.isLoading = false;
            this.smoothScroll.refresh();
            this.initSidebarPin();
          }, 500);
        }
      });
  }

  ngOnInit(): void {
    this.loaderService.setContext('user-panel');

    if (this.isBrowser) {
      gsap.registerPlugin(ScrollTrigger);
    }

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
      this.initSidebarPin();
    }, 200);
  }

  private initSidebarPin(): void {
    if (!this.isBrowser) return;

    this.pinTrigger?.kill();

    if (this.asidePanelRef?.nativeElement && this.panelContainerRef?.nativeElement) {
      const isDesktop = window.innerWidth >= 1024;
      const topOffset = isDesktop ? '80px' : '72px';

      this.pinTrigger = ScrollTrigger.create({
        trigger: this.asidePanelRef.nativeElement,
        start: `top ${topOffset}`,
        endTrigger: this.panelContainerRef.nativeElement,
        end: 'bottom bottom',
        pin: true,
        pinSpacing: false,
        invalidateOnRefresh: true
      });
    }
  }

  ngOnDestroy() {
    this.loaderService.setContext('public');
    this.authSubscription?.unsubscribe();
    this.pinTrigger?.kill();
  }

  onSignOut() {
    this.authService.signOut();
  }
}