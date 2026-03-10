import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Product } from '../../../utils/models/Products-supabase.interface';
import { CardproductComponent } from '../../generic/cardproduct/cardproduct.component';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, CardproductComponent],
  templateUrl: './product-carousel.component.html'
})
export class ProductCarouselComponent implements OnInit {
  @Input() products: Product[] = [];
  @Input() title = '';
  @Input() maxProducts = 6;
  @Input() visibleProducts = 4;

  displayProducts: Product[] = [];
  index = 0;

  ngOnInit() {
    this.displayProducts = this.products.slice(0, this.maxProducts);
  }

  get maxIndex(): number {
    return Math.max(0, this.displayProducts.length - this.visibleProducts);
  }

  next() {
    // Si ya estamos al final, volvemos al inicio
    this.index = this.index >= this.maxIndex ? 0 : this.index + 1;
  }

  prev() {
    // Si ya estamos al inicio, saltamos al final
    this.index = this.index <= 0 ? this.maxIndex : this.index - 1;
  }

  get translate(): string {
    return `translateX(-${this.index * (100 / this.visibleProducts)}%)`;
  }

  get hasProducts(): boolean {
    return this.displayProducts.length > 0;
  }
}