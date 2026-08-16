
import {
  Component,
  Input,
  OnInit,
  HostListener,
  ChangeDetectionStrategy
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Product } from '../../../utils/models/Products-supabase.interface';
import { CardproductComponent } from '../../generic/cardproduct/cardproduct.component';
import {
  ChevronLeft,
  ChevronRight,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
} from 'lucide-angular';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [
    RouterModule,
    CardproductComponent,
    LucideAngularModule
],
  templateUrl: './product-carousel.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        ChevronLeft,
        ChevronRight,
      })
    }
  ]
})
export class ProductCarouselComponent implements OnInit {
  @Input() products: Product[] = [];
  @Input() carouselTitle = '';
  @Input() maxProducts = 6;
  @Input() visibleProducts = 3;

  displayProducts: Product[] = [];
  index = 0;

  ngOnInit() {
    this.displayProducts = this.products.slice(0, this.maxProducts);
    this.updateVisibleProducts();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateVisibleProducts();
  }

  private updateVisibleProducts() {
    const width = window.innerWidth;

    if (width < 1024) {
      this.visibleProducts = 2;
    } else {
      this.visibleProducts = 3;
    }
    if (this.index > this.maxIndex) {
      this.index = this.maxIndex;
    }
  }

  get maxIndex(): number {
    return Math.max(
      0,
      this.displayProducts.length - this.visibleProducts
    );
  }

  next() {
    this.index = this.index >= this.maxIndex
      ? 0
      : this.index + 1;
  }

  prev() {
    this.index = this.index <= 0
      ? this.maxIndex
      : this.index - 1;
  }

  get translate(): string {
    return `translateX(-${this.index * (100 / this.visibleProducts)}%)`;
  }

  get hasProducts(): boolean {
    return this.displayProducts.length > 0;
  }
}