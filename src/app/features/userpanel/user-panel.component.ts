import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs/operators';
import { BreadcrumbComponent } from '../../shared/components/system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../shared/utils/models/app-menu-item.model';
import { NavbarPublicv2Component } from "../../shared/components/system/navbar-publicv2/navbar-publicv2.component";

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarPublicv2Component],
  templateUrl: './user-panel.component.html',
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
      icon: '',
      route: '/panel-control'
    },
    {
      title: 'Información Personal',
      icon: '',
      route: '/informacion-cuenta'
    },
    {
      title: 'Mis Órdenes',
      icon: '',
      route: '/historial-ordenes'
    },
    {
      title: 'Cerrar Sesión',
      icon: '',
      route: '/cerrar-sesion'
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

        // Hide spinner with a delay
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

  async onSignOut(): Promise<void> {
    const result = await this.authService.signOut();
    if (!result.success) {
      this.router.navigate(['/login']);
    }
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }
}