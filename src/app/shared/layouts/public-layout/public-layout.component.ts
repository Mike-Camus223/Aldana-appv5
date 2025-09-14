import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { NavbarPublicv2Component } from "../../components/system/navbar-publicv2/navbar-publicv2.component";
import { Footerv2Component } from '../../components/system/footerv2/footerv2.component';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { Subscription, filter } from 'rxjs';
import { NewsletterComponent } from "../../components/system/newsletter/newsletter.component";

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarPublicv2Component,
    Footerv2Component,
    NewsletterComponent
],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;

  constructor(private loaderService: LoaderService, private router: Router) {}

  ngOnInit(): void {
    // Establecer contexto público al inicializar
    this.loaderService.setContext('public');
    
    this.loaderService.setSkipGenericLoaderMatchers([
      /^\/checkout\/(?!carrito).*/,
    ]);

    this.loaderService.showLoaderOnNavigationIfAllowed(this.router.url);

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe((event: NavigationStart) => {
      // Mantener contexto público para navegación desde Public Layout
      this.loaderService.setContext('public');
      this.loaderService.showLoaderOnNavigationIfAllowed(event.url);
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

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}