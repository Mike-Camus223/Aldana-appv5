import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../components/footer/footer.component';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { DiscountLeafComponent } from '../../components/system/discount-leaf/discount-leaf.component';
import { SmoothScrollService } from '../../../core/services/utils/smooth-scroll.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    DiscountLeafComponent,
  ],
  templateUrl: './public-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: ``
})
export class PublicLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
  private loaderService = inject(LoaderService);
  private smoothScroll = inject(SmoothScrollService);

  ngAfterViewInit(): void {
    this.smoothScroll.ensureSmoother();
  }

  ngOnInit(): void {
    this.loaderService.setSkipGenericLoaderMatchers([
      /^\/checkout\/(?!carrito).*/,
    ]);
  }

  ngOnDestroy(): void {}
}
