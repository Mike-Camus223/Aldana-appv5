import { Component, OnInit, inject, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, NavigationStart, NavigationCancel, NavigationError, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { User } from '@supabase/supabase-js';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../core/services/utils/loader.service';
import { Footerv2Component } from '../../shared/components/system/footerv2/footerv2.component';
import { SmoothScrollService } from '../../core/services/utils/smooth-scroll.service';

@Component({
  selector: 'app-auth-panel',
  standalone: true,
  imports: [RouterModule, Footerv2Component],
  templateUrl: './authPanel.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./authPanel.component.css']
})
export class AuthPanelComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('scrollCol') scrollCol!: ElementRef<HTMLDivElement>;

  currentUser: User | null = null;
  isLoading = false;
  showArrow = false;
  private authSubscription?: Subscription;

  private authService = inject(AuthService);
  private router = inject(Router);
  private loaderService = inject(LoaderService);
  private smoothScroll = inject(SmoothScrollService);

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
            this.smoothScroll.refresh();
          }, 100);
          this.resetArrow();
          this.scheduleArrow();
        }
      });
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.router.navigate(['/panel/panel-control']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.smoothScroll.ensureSmoother();
    this.scheduleArrow();
  }

  ngOnDestroy(): void {
    this.loaderService.setContext('public');
    this.clearTimers();
    this.authSubscription?.unsubscribe();
  }

  private scheduleArrow(): void {
    this.initialTimeout = setTimeout(() => {
      const el = this.scrollCol?.nativeElement;
      if (el && el.scrollHeight > el.clientHeight) {
        this.showArrow = true;
      }
    }, 4000);
  }

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