import { Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { SmoothScrollService } from '../../../../core/services/utils/smooth-scroll.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './cart.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements AfterViewInit, OnDestroy {
  cartIsEmpty = true;
  private smoothScroll = inject(SmoothScrollService);
  private routerSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    public router: Router
  ) {
    this.cartService.cartItems$.subscribe(items => {
      this.cartIsEmpty = items.length === 0;
    });

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.smoothScroll.refresh();
          this.smoothScroll.scrollToTop();
        }, 100);
      });
  }

  ngAfterViewInit(): void {
    this.smoothScroll.ensureSmoother();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
