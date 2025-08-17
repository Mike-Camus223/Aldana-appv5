import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth/auth.service';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  email_confirmed_at: string;
}

@Component({
  selector: 'app-users-management',
  imports: [CommonModule],
  templateUrl: './users-management.component.html',
  styles: ``
})
export class UsersManagementComponent implements OnInit {
  
  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    this.loadUsers();
  }
  
  // Datos hardcodeados de ejemplo (en producción vendrían de Supabase)
  users: User[] = [
    {
      id: '1',
      email: 'admin@aldana.com',
      role: 'admin',
      created_at: '2024-01-15T10:30:00Z',
      email_confirmed_at: '2024-01-15T10:35:00Z'
    },
    {
      id: '2', 
      email: 'maria@email.com',
      role: 'user',
      created_at: '2024-01-14T15:20:00Z',
      email_confirmed_at: '2024-01-14T15:25:00Z'
    },
    {
      id: '3',
      email: 'juan@email.com', 
      role: 'user',
      created_at: '2024-01-13T09:15:00Z',
      email_confirmed_at: '2024-01-13T09:20:00Z'
    },
    {
      id: '4',
      email: 'ana@email.com',
      role: 'user', 
      created_at: '2024-01-12T14:45:00Z',
      email_confirmed_at: '2024-01-12T14:50:00Z'
    },
    {
      id: '5',
      email: 'moderador@aldana.com',
      role: 'admin',
      created_at: '2024-01-11T11:30:00Z', 
      email_confirmed_at: '2024-01-11T11:35:00Z'
    }
  ];
  
  filteredUsers = [...this.users];
  searchTerm = '';
  selectedRole = 'all';
  
  loadUsers() {
    // En producción, aquí harías una llamada a Supabase para obtener usuarios
    // Por ahora usamos datos hardcodeados
    this.filteredUsers = [...this.users];
  }
  
  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      return matchesSearch && matchesRole;
    });
  }
  
  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.filterUsers();
  }
  
  onRoleFilterChange(event: any) {
    this.selectedRole = event.target.value;
    this.filterUsers();
  }
  
  async toggleUserRole(user: User) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    
    // En producción, aquí harías la llamada a updateUserRole del AuthService
    // const result = await this.authService.updateUserRole(user.id, newRole);
    
    // Por ahora simulamos el cambio
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      this.users[userIndex].role = newRole;
      this.filterUsers();
    }
    
    console.log(`Usuario ${user.email} cambiado a rol: ${newRole}`);
  }
  
  getRoleDisplayName(role: string): string {
    return role === 'admin' ? 'Administrador' : 'Usuario';
  }
  
  getRoleBadgeClass(role: string): string {
    return role === 'admin' 
      ? 'bg-red-100 text-red-800' 
      : 'bg-green-100 text-green-800';
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  get adminCount(): number {
    return this.users.filter(u => u.role === 'admin').length;
  }
  
  get userCount(): number {
    return this.users.filter(u => u.role === 'user').length;
  }
  
  get totalUsers(): number {
    return this.users.length;
  }
}
