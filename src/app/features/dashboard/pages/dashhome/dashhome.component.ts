import { Component, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-dashhome',
  imports: [],
  templateUrl: './dashhome.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: ``
})
export class DashhomeComponent {
  
  // Datos hardcodeados para el dashboard
  stats = [
    {
      title: 'Ventas Totales',
      value: '$45,230',
      change: '+12.5%',
      changeType: 'positive',
      icon: 'fas fa-dollar-sign',
      color: 'bg-green-500'
    },
    {
      title: 'Pedidos',
      value: '156',
      change: '+8.2%',
      changeType: 'positive',
      icon: 'fas fa-shopping-cart',
      color: 'bg-blue-500'
    },
    {
      title: 'Productos',
      value: '89',
      change: '+3.1%',
      changeType: 'positive',
      icon: 'fas fa-box',
      color: 'bg-purple-500'
    },
    {
      title: 'Usuarios',
      value: '1,234',
      change: '+15.3%',
      changeType: 'positive',
      icon: 'fas fa-users',
      color: 'bg-orange-500'
    }
  ];
  
  recentOrders = [
    {
      id: 'ORD-001',
      customer: 'María García',
      email: 'maria@email.com',
      total: '$125.50',
      status: 'Completado',
      statusColor: 'bg-green-100 text-green-800',
      date: '2024-01-15'
    },
    {
      id: 'ORD-002',
      customer: 'Juan Pérez',
      email: 'juan@email.com',
      total: '$89.99',
      status: 'Pendiente',
      statusColor: 'bg-yellow-100 text-yellow-800',
      date: '2024-01-14'
    },
    {
      id: 'ORD-003',
      customer: 'Ana López',
      email: 'ana@email.com',
      total: '$234.00',
      status: 'Enviado',
      statusColor: 'bg-blue-100 text-blue-800',
      date: '2024-01-13'
    },
    {
      id: 'ORD-004',
      customer: 'Carlos Ruiz',
      email: 'carlos@email.com',
      total: '$67.25',
      status: 'Cancelado',
      statusColor: 'bg-red-100 text-red-800',
      date: '2024-01-12'
    }
  ];
  
  topProducts = [
    {
      name: 'Vestido Elegante Rosa',
      sales: 45,
      revenue: '$2,250',
      image: 'https://via.placeholder.com/50x50'
    },
    {
      name: 'Blusa Casual Azul',
      sales: 38,
      revenue: '$1,520',
      image: 'https://via.placeholder.com/50x50'
    },
    {
      name: 'Falda Midi Negra',
      sales: 32,
      revenue: '$1,280',
      image: 'https://via.placeholder.com/50x50'
    },
    {
      name: 'Chaqueta Denim',
      sales: 28,
      revenue: '$1,400',
      image: 'https://via.placeholder.com/50x50'
    }
  ];
}
