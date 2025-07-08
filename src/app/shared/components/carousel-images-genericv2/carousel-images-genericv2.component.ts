import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import KeenSlider, { KeenSliderInstance } from 'keen-slider';
import { FadeupallDirective } from '../../utils/directives/fadeupall.directive';

@Component({
  selector: 'app-carousel-images-genericv2',
  standalone: true,
  imports: [CommonModule, FadeupallDirective],
  templateUrl: './carousel-images-genericv2.component.html',
  styleUrls: ['./carousel-images-genericv2.component.css']
})
export class CarouselImagesGenericv2Component implements AfterViewInit, OnDestroy {
  @ViewChild('sliderRef', { static: true }) sliderRef!: ElementRef<HTMLElement>;

  @Input() images: any[] = [];
  @Input() aspectRatio: string = '4 / 5';
  @Input() hoverOverlay: boolean = true;
  @Input() hoverIconClass: string = 'fab fa-instagram';

  @Input() slidesPerView: number = 3;
  @Input() spacing: number = 15;
  @Input() loop: boolean = true;

  @Input() breakpoints: Record<string, any> = {
    '(min-width: 640px)': { slides: { perView: 3, spacing: 15 } },
    '(min-width: 768px)': { slides: { perView: 4, spacing: 15 } },
    '(min-width: 1024px)': { slides: { perView: 5, spacing: 15 } }
  };

  @Output() imageClick = new EventEmitter<any>();

  private sliderInstance: KeenSliderInstance | null = null;

  ngAfterViewInit(): void {
    if (this.images.length && this.sliderRef?.nativeElement) {
      this.initializeSlider();
    }
  }

  private initializeSlider(): void {
    this.sliderInstance = new KeenSlider(this.sliderRef.nativeElement, {
      loop: this.loop,
      mode: 'snap',
      slides: {
        perView: this.slidesPerView,
        spacing: this.spacing,
      },
      breakpoints: this.breakpoints
    });
  }

  ngOnDestroy(): void {
    this.sliderInstance?.destroy();
  }

  getPaddingBottom(): string {
    const [w, h] = this.aspectRatio.split('/').map(Number);
    return `${(h / w) * 100}%`;
  }
}
