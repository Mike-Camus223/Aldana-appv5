
import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { LoadingScreenGenericComponent } from "./shared/components/system/loading-screen-generic/loading-screen-generic.component";
import { LoadingScreenComponent } from './shared/components/system/loading-screen/loading-screen.component';
import { ToastNotificationComponent } from './shared/components/system/toast-notification/toast-notification.component';
import { DiscountLeafComponent } from './shared/components/system/discount-leaf/discount-leaf.component';
import { LoaderService } from './core/services/utils/loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastNotificationComponent,
    LoadingScreenGenericComponent,
    LoadingScreenComponent,
    DiscountLeafComponent
],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Aldyapp2';
  showMainLoader = false;

  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller,
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
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.viewportScroller.scrollToPosition([0, 0]);
      });
  }

  onMainLoadingFinished(): void {
    this.showMainLoader = false;
  }
}
