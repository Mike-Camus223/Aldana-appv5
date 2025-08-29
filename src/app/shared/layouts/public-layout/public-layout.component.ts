import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { NavbarPublicv2Component } from "../../components/system/navbar-publicv2/navbar-publicv2.component";
import { Footerv2Component } from '../../components/system/footerv2/footerv2.component';
import { LoadingScreenComponent } from "../../components/system/loading-screen/loading-screen.component";
import { LoadingScreenGenericComponent } from '../../components/system/loading-screen-generic/loading-screen-generic.component';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { Subscription, filter } from 'rxjs';
import { NewsletterComponent } from "../../components/system/newsletter/newsletter.component";

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarPublicv2Component,
    Footerv2Component,
    LoadingScreenComponent,
    LoadingScreenGenericComponent,
    NewsletterComponent
],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  showMainLoader = true;
  private routerSubscription?: Subscription;

  constructor(private loaderService: LoaderService, private router: Router) { }

  ngOnInit(): void {
    this.loaderService.setSkipGenericLoaderMatchers([
      /^\/checkout\/(?!carrito).*/,
    ]);

    this.loaderService.showLoaderOnNavigationIfAllowed(this.router.url);

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe((event: NavigationStart) => {
      if (!this.showMainLoader) {
        this.loaderService.showLoaderOnNavigationIfAllowed(event.url);
      }
    });

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      if (url.startsWith('/checkout/') && !url.includes('/checkout/carrito')) {
        this.loaderService.triggerAnimations();
      }
    });
  }

  onMainLoadingFinished(): void {
    this.showMainLoader = false;
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}