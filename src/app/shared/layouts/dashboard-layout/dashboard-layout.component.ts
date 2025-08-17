import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './dashboard-layout.component.html',
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
export default class DashboardLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  sidebarOpen = true;
  
  menuItems = [
    {
      icon: 'fas fa-home',
      label: 'Dashboard',
      route: '/dashboard/home',
      active: true
    },
    {
      icon: 'fas fa-plus-circle',
      label: 'Crear Producto',
      route: '/dashboard/creation',
      active: false
    },
    {
      icon: 'fas fa-box',
      label: 'Inventario',
      route: '/dashboard/storage',
      active: false
    },
    {
      icon: 'fas fa-shopping-cart',
      label: 'Pedidos',
      route: '/dashboard/orders',
      active: false
    },
    {
      icon: 'fas fa-users',
      label: 'Usuarios',
      route: '/dashboard/users',
      active: false
    },
    {
      icon: 'fas fa-chart-bar',
      label: 'Reportes',
      route: '/dashboard/reports',
      active: false
    }
  ];
  
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
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
