import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-historial-ordenes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './historial-ordenes.component.html',
  styleUrls: ['./historial-ordenes.component.css']
})
export default class HistorialOrdenesComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.checkAuthentication();
    this.loadOrderHistory();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  private checkAuthentication(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Carga el historial de órdenes del usuario
   */
  private async loadOrderHistory(): Promise<void> {
    try {
      // Aquí se implementaría la lógica para cargar las órdenes desde Supabase
      // Por ahora, simulamos datos de ejemplo
      setTimeout(() => {
        this.orders = [
          {
            id: '001',
            date: new Date('2024-01-15'),
            total: 89.99,
            status: 'Entregado',
            items: 3
          },
          {
            id: '002',
            date: new Date('2024-01-10'),
            total: 149.50,
            status: 'En tránsito',
            items: 2
          }
        ];
        this.loading = false;
      }, 1000);
    } catch (error) {
      console.error('Error al cargar historial de órdenes:', error);
      this.loading = false;
    }
  }

  /**
   * Navega de vuelta al panel principal
   */
  goBackToPanel(): void {
    this.router.navigate(['/user-panel']);
  }

  /**
   * Ver detalles de una orden específica
   */
  viewOrderDetails(orderId: string): void {
    // Implementar navegación a detalles de orden
    console.log('Ver detalles de orden:', orderId);
  }
}
