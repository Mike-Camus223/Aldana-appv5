import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';

@Component({
  selector: 'app-user-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.css']
})
export default class UserPanelComponent implements OnInit {
  currentUser: User | null = null;
  activeSection: string = 'dashboard';
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Cierra la sesión del usuario
   */
  async onSignOut(): Promise<void> {
    const result = await this.authService.signOut();
    if (!result.success) {
      // Error handling without console.log
      this.router.navigate(['/login']);
    }
  }

  /**
   * Establece la sección activa del panel
   */
  setActiveSection(section: string): void {
    this.activeSection = section;
    
    switch (section) {
      case 'orders':
        this.router.navigate(['/user-panel/historial-ordenes']);
        break;
      case 'account':
        this.router.navigate(['/user-panel/cuenta']);
        break;
      case 'delete':
        this.router.navigate(['/user-panel/borrar-cuenta']);
        break;
      default:
        this.activeSection = 'dashboard';
        break;
    }
  }

  /**
   * Navega a la sección de historial de órdenes
   */
  goToOrderHistory(): void {
    this.setActiveSection('orders');
  }

  /**
   * Navega a la sección de cuenta
   */
  goToAccount(): void {
    this.setActiveSection('account');
  }

  /**
   * Navega a la sección de eliminar cuenta
   */
  goToDeleteAccount(): void {
    this.setActiveSection('delete');
  }
}
