import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footerv2Component } from '../../components/system/footerv2/footerv2.component';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { NavbarPublicv3Component } from '../../components/system/navbar-publicv3/navbar-publicv3.component';
import { SmoothScrollService } from '../../../core/services/utils/smooth-scroll.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarPublicv3Component,
    Footerv2Component,
  ],
  templateUrl: './public-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: ``
})
export class PublicLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  private loaderService = inject(LoaderService);
  private smoothScroll = inject(SmoothScrollService);

  ngAfterViewInit(): void {
    this.smoothScroll.init();
  }

  ngOnInit(): void {
    this.loaderService.setSkipGenericLoaderMatchers([
      /^\/checkout\/(?!carrito).*/,
    ]);
  }

  ngOnDestroy(): void {}
}
