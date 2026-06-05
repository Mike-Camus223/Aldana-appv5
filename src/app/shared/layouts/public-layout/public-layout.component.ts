import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { Footerv2Component } from '../../components/system/footerv2/footerv2.component';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { Subscription, filter } from 'rxjs';
import { NavbarPublicv3Component } from '../../components/system/navbar-publicv3/navbar-publicv3.component';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarPublicv3Component,
    Footerv2Component,
  ],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export class PublicLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  private routerSubscription?: Subscription;

  constructor(
    private loaderService: LoaderService,
    private router: Router
  ) { }

  ngAfterViewInit(): void {
    ScrollSmoother.get()?.kill();

    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.4,
      effects: true
    });
  }

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
      // Avoid showing loader if only query params change (e.g. search filters)
      const currentPath = this.router.url.split('?')[0];
      const newPath = event.url.split('?')[0];
      if (currentPath === newPath) {
        return;
      }

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
