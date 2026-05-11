import {
  Component,
  Input,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';
import { VideoComponent } from '../video/video.component';
import { LoaderService } from '../../../../core/services/utils/loader.service';
import { Subscription } from 'rxjs';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';

@Component({
  selector: 'app-bettercustom-dual',
  standalone: true,
  imports: [CommonModule, WordRevealDirective, FadeUpLetterDirective, VideoComponent, CardInitAnimationDirective],
  templateUrl: './bettercustom-dual.component.html',
  styleUrls: ['./bettercustom-dual.component.css'],
})
export class BettercustomDualComponent implements AfterViewInit, OnDestroy {
  @Input() mediaType: 'image' | 'video' = 'image';
  @Input() imageUrl = '';
  @Input() videoSrc = '';
  @Input() videoAutoplay = true;
  @Input() videoMuted = true;
  @Input() videoShowControls = true;
  @Input() videoGradientOverlay = true;
  @Input() videoObjectFit = 'object-cover';
  @Input() CommentsTestimonial = false;
  @Input() title = '';
  @Input() SeparationTitle = '';
  @Input() StylesText = '';
  @Input() StylesTitle = '';
  @Input() subtitles: string[] = [];
  @Input() contentTestimonial = '';
  @Input() content = '';
  @Input() extraContent = '';
  @Input() gridCols = '3fr 2fr';
  @Input() textContainerClass = '';
  @Input() desktopOrder: 'image-first' | 'text-first' = 'image-first';
  @Input() minHeight = '350px';
  @Input() aspectRatio = '16/9';
  @Input() useAspectRatio = false;
  @Input() maxwidthandpadding = '';
  @Input() divider = false;
  @Input() textcontetclass = '';
  @Input() textextracontetclass = '';
  @Input() titleAndContentClass = '';
  @Input() imageStyles = '';

  @ViewChild('parallaxImage', { static: false }) parallaxImage!: ElementRef<HTMLImageElement>;

  // Breakpoint custom: 990px
  isMobile = false;
  private animSub?: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private loaderService: LoaderService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 990;
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 990;
    }
  }

  ngAfterViewInit() {
    if (this.mediaType === 'video' && !this.videoSrc) {
      console.warn('BettercustomDualComponent: mediaType es "video" pero falta videoSrc.');
    }
    if (isPlatformBrowser(this.platformId)) {
      this.animSub = this.loaderService.animationsEnabled$.subscribe(() => {});
    }
  }

  ngOnDestroy() {
    this.animSub?.unsubscribe();
  }

  get gridStyle(): Record<string, string> {
    if (this.isMobile) return {};
    return {
      gridTemplateColumns: this.gridCols,
      minHeight: this.minHeight,
    };
  }

  // Mobile: media siempre order 1, desktop respeta desktopOrder
  get mediaOrderClass(): string {
    return this.desktopOrder === 'image-first'
      ? 'dual-order-media-1'
      : 'dual-order-media-2';
  }

  get textOrderClass(): string {
    return this.desktopOrder === 'image-first'
      ? 'dual-order-text-2'
      : 'dual-order-text-1';
  }
}