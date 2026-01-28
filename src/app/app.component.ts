
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule, ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';
import { LoadingScreenGenericComponent } from "./shared/components/system/loading-screen-generic/loading-screen-generic.component";
import { LoadingScreenComponent } from './shared/components/system/loading-screen/loading-screen.component';
import { ToastNotificationComponent } from './shared/components/system/toast-notification/toast-notification.component';
import { DiscountLeafComponent } from './shared/components/system/discount-leaf/discount-leaf.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    ToastNotificationComponent,
    LoadingScreenGenericComponent, 
    LoadingScreenComponent,
    CommonModule,
    DiscountLeafComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Aldyapp2';
  showMainLoader = true;

  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller
  ) {}

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
