
import { Component, OnInit, inject, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AppMenuItem } from '../../shared/utils/models/app-menu-item.model';
import { Heart, LogOut, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Package, Settings, UserRound } from 'lucide-angular';
import { LoaderService } from '../../core/services/utils/loader.service';
import { NavbarPublicv3Component } from '../../shared/components/system/navbar-publicv3/navbar-publicv3.component';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, NavbarPublicv3Component],
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./user-panel.component.css']
})
export class UserPanelComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  activeSection: string = 'control-panel';
  isLoading = false;
  private authSubscription?: Subscription;

  breadcrumbItemsAccount: AppMenuItem[] = [
      { label: 'INICIO', route: '/home' },
      { label: 'MI CUENTA', route: '/panel/panel-control' }
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
  private loaderService = inject(LoaderService);
  private previousUrl: string | null = null;

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

        if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          const currentUrl = event.url;
          
          // Ocultar loader después de un pequeño retraso para evitar parpadeo
          setTimeout(() => {
            this.isLoading = false;
          }, 100);
        }
      });
  }

  // Verificar si la URL pertenece al panel de usuario
  private isUserPanelRoute(url: string): boolean {
    return this.navItems.some(item => url.includes(item.route));
  }

  ngOnInit(): void {
    // Establecer contexto user-panel al inicializar el componente
    this.loaderService.setContext('user-panel');
    
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy() {
    // Restablecer contexto público al salir del panel de usuario
    this.loaderService.setContext('public');
    this.authSubscription?.unsubscribe();
  }

  onSignOut() {
    this.authService.signOut();
  }
}