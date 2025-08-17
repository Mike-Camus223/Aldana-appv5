import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart } from '@angular/router';
import { NavbarPublicv2Component } from "../../components/navbar-publicv2/navbar-publicv2.component";
import { Footerv2Component } from '../../components/footerv2/footerv2.component';
import { LoadingScreenComponent } from "../../components/loading-screen/loading-screen.component";
import { LoadingScreenGenericComponent } from '../../components/loading-screen-generic/loading-screen-generic.component';
import { RouterOutlet } from '@angular/router';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarPublicv2Component,
    Footerv2Component,
    LoadingScreenComponent,
    LoadingScreenGenericComponent
  ],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  showMainLoader = true;
  private routerSubscription?: Subscription;

  constructor(private loaderService: LoaderService, private router: Router) { }

  ngOnInit(): void {
    this.loaderService.showLoaderOnNavigation();

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe((event: NavigationStart) => {
      if (!this.showMainLoader) {
        this.loaderService.showLoaderOnNavigation();
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