import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { LoadingScreenGenericComponent } from "./shared/components/system/loading-screen-generic/loading-screen-generic.component";
import { LoadingScreenV2Component } from './shared/components/system/loading-screen-v2/loading-screen-v2.component';
import { ToastNotificationComponent } from './shared/components/system/toast-notification/toast-notification.component';
import { CustomCursorComponent } from './shared/components/system/custom-cursor/custom-cursor.component';
import { LoaderService } from './core/services/utils/loader.service';
import { SmoothScrollService } from './core/services/utils/smooth-scroll.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastNotificationComponent,
    LoadingScreenGenericComponent,
    LoadingScreenV2Component,
    CustomCursorComponent
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Aldyapp2';
  showMainLoader = false;
  private smoothScrollService = inject(SmoothScrollService);
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const initialPath = window.location.pathname;
      this.showMainLoader = this.loaderService.getShowMainLoader(initialPath);
    } else {
      this.showMainLoader = false;
    }
  }

  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.smoothScrollService.scrollToTop(false);
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.smoothScrollService.destroy();
  }

  onMainLoadingFinished(): void {
    this.showMainLoader = false;
  }
}
