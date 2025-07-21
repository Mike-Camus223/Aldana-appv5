import { Component, Input, Output, EventEmitter, OnInit, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../utils/models/Products-supabase.interface';
import { Heart, HeartPlus, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-cardproduct',
  standalone: true,
  imports: [CommonModule, RouterModule,LucideAngularModule],
  templateUrl: './cardproduct.component.html',
  styleUrls: ['./cardproduct.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Heart,
        HeartPlus
      })
    }
  ]
})
export class CardproductComponent implements OnInit {
  @Input() product!: Product;
  @Input() selectedColor: string = '';
  @Input() displayImage: string = '';

  @Input() mobileMode: 'ismobile' | 'isdesktop' = 'ismobile';
  @Input() desktopMode: 'ismobile' | 'isdesktop' = 'isdesktop';

  @Output() colorSelected = new EventEmitter<{ productId: string, color: string }>();
  @Output() wishlistToggled = new EventEmitter<string>();

  isMobileView: boolean = false;

  ngOnInit(): void {
    this.updateView();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateView();
  }

  private updateView(): void {
    const isMobileScreen = window.innerWidth < 768;

    if (isMobileScreen) {
      this.isMobileView = this.mobileMode === 'ismobile';
    } else {
      this.isMobileView = this.desktopMode === 'ismobile';
    }
  }

  toggleWishlist(): void {
    this.wishlistToggled.emit(this.product.id);
  }

  selectColor(color: string): void {
    if (this.selectedColor === color) return;
    this.colorSelected.emit({ productId: this.product.id, color });
  }
}
