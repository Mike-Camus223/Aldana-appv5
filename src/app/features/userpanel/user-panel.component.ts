import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs/operators';
import { AppMenuItem } from '../../shared/utils/models/app-menu-item.model';
import { NavbarPublicv2Component } from "../../shared/components/system/navbar-publicv2/navbar-publicv2.component";
import { Heart, LogOut, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Package, Settings, UserRound } from 'lucide-angular';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarPublicv2Component,LucideAngularModule],
  templateUrl: './user-panel.component.html',
  providers: [
      {
        provide: LUCIDE_ICONS,
        multi: true,
        useValue: new LucideIconProvider({
          Settings,
          UserRound,
          Package,
          LogOut,
          Heart
        })
      }
    ],
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'control-panel';
  isLoading = false;

  breadcrumbItemsAccount: AppMenuItem[] = [
      { label: 'INICIO', route: '/home' },
      { label: 'MI CUENTA', route: '/panel-control' }
    ];
  
  navItems = [
    {
      title: 'Panel de Control',
      icon: 'settings',
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

  constructor() {
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

        if (event instanceof NavigationEnd) {
          const currentRoute = event.urlAfterRedirects || event.url;
          const currentItem = this.navItems.find(item => 
            currentRoute.includes(item.route)
          );
        }
        setTimeout(() => this.isLoading = false, 300);
      });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  onSignOut() {
    this.authService.signOut();
  }
}