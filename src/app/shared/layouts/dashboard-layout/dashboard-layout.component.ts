import { Component, inject, ChangeDetectionStrategy, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { SmoothScrollService } from '../../../core/services/utils/smooth-scroll.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .sidebar {
      transition: transform 0.3s ease;
    }
    
    .sidebar-collapsed {
      transform: translateX(-100%);
    }
    
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        z-index: 50;
      }
    }
  `
})
export default class DashboardLayoutComponent implements AfterViewInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private smoothScroll = inject(SmoothScrollService);
  private routerSubscription?: Subscription;
  
  sidebarOpen = true;
  
  menuItems = [
    {
      icon: 'fas fa-home',
      label: 'Dashboard',
      route: '/admin/panel-de-control',
      active: true
    },
    {
      icon: 'fas fa-plus-circle',
      label: 'Crear Producto',
      route: '/admin/creation',
      active: false
    },
    {
      icon: 'fas fa-box',
      label: 'Inventario',
      route: '/admin/storage',
      active: false
    },
    {
      icon: 'fas fa-shopping-cart',
      label: 'Pedidos',
      route: '/admin/orders',
      active: false
    },
    {
      icon: 'fas fa-users',
      label: 'Usuarios',
      route: '/admin/users',
      active: false
    },
    {
      icon: 'fas fa-chart-bar',
      label: 'Reportes',
      route: '/admin/reports',
      active: false
    }
  ];

  constructor() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.smoothScroll.refresh();
        }, 100);
      });
  }

  ngAfterViewInit(): void {
    this.smoothScroll.ensureSmoother();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
  
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    setTimeout(() => {
      this.smoothScroll.refresh();
    }, 350);
  }
  
  setActiveMenuItem(route: string) {
    this.menuItems.forEach(item => {
      item.active = item.route === route;
    });
  }
  
  async logout() {
    await this.authService.signOut();
  }
  
  get currentUser() {
    return this.authService.getCurrentUser();
  }
}
