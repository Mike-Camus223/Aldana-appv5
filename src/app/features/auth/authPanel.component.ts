import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs/operators';
import { LoaderService } from '../../core/services/utils/loader.service';
import { Footerv2Component } from '../../shared/components/system/footerv2/footerv2.component';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, Footerv2Component],
  templateUrl: './authPanel.component.html',
  styleUrls: ['./authPanel.component.css']
})
export class AuthPanelComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('scrollCol') scrollCol!: ElementRef<HTMLDivElement>;

  currentUser: User | null = null;
  isLoading = false;
  showArrow = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private loaderService = inject(LoaderService);

  private arrowTimeout: any = null;
  private initialTimeout: any = null;

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
          this.resetArrow();
          return;
        }
        if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          setTimeout(() => {
            this.isLoading = false;
          }, 100);
          // Cada vez que cambia la ruta, reinicia el timer de la flecha
          this.resetArrow();
          this.scheduleArrow();
        }
      });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        if (this.authService.isAdmin()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/panel-control']);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.scheduleArrow();
  }

  ngOnDestroy(): void {
    this.loaderService.setContext('public');
    this.clearTimers();
  }

  // Aparece a los 4s si hay contenido para scrollear
  private scheduleArrow(): void {
    this.initialTimeout = setTimeout(() => {
      const el = this.scrollCol?.nativeElement;
      if (el && el.scrollHeight > el.clientHeight) {
        this.showArrow = true;
      }
    }, 4000);
  }

  // Al scroll o click: oculta, espera 4s, reaparece si aún hay contenido abajo
  onScroll(): void {
    this.hideArrowTemporarily();
  }

  scrollToBottom(): void {
    const el = this.scrollCol?.nativeElement;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
    this.hideArrowTemporarily();
  }

  private hideArrowTemporarily(): void {
    this.showArrow = false;
    this.clearTimers();
    this.arrowTimeout = setTimeout(() => {
      const el = this.scrollCol?.nativeElement;
      // Solo reaparece si no está al final del scroll
      if (el && el.scrollTop + el.clientHeight < el.scrollHeight - 10) {
        this.showArrow = true;
      }
    }, 4000);
  }

  private resetArrow(): void {
    this.showArrow = false;
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.arrowTimeout) clearTimeout(this.arrowTimeout);
    if (this.initialTimeout) clearTimeout(this.initialTimeout);
  }
}