import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs/operators';
import { LoaderService } from '../../core/services/utils/loader.service';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './authPanel.component.html',
  styleUrls: ['./authPanel.component.css']
})
export class AuthPanelComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private loaderService = inject(LoaderService);

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
          // Ocultar loader después de un pequeño retraso para evitar parpadeo
          setTimeout(() => {
            this.isLoading = false;
          }, 100);
        }
      });
  }

  ngOnInit(): void {
    // Establecer contexto auth-panel al inicializar el componente
    
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Si el usuario está autenticado, redirigir según su rol
      if (user) {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/panel-control']);
        }
      }
    });
  }

  ngOnDestroy() {
    // Restablecer contexto público al salir del panel de auth
    this.loaderService.setContext('public');
  }
}