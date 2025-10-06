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
  @Input() SeparationTitle: string = '';
  @Input() StylesText: string = '';
  @Input() StylesTitle: string = '';
  @Input() subtitles: string[] = [];
  @Input() contentTestimonial = '';
  @Input() content = '';
  @Input() extraContent = '';
  @Input() imageWidth = '60%';
  @Input() textWidth = '40%';
  @Input() textContainerClass = '';
  @Input() mobileOrder: 'image-first' | 'text-first' = 'image-first';
  @Input() desktopOrder: 'image-first' | 'text-first' = 'image-first';
  @Input() height: string = '200px';
  @Input() mobileHeight: string = '';
  @Input() maxwidthandpadding: string = '';
  @Input() divider: boolean = false;
  @Input() textcontetclass: string = '';
  @Input() textextracontetclass: string = '';
  @Input() titleAndContentClass: string = '';
  @Input() aspectRatio: string = '3 / 2';
  @Input() useAspectRatio: boolean = false;
  @Input() imageStyles: string = '';

  @ViewChild('parallaxImage', { static: false }) parallaxImage!: ElementRef<HTMLImageElement>;
  @ViewChild('parallaxContainer', { static: false }) parallaxContainer!: ElementRef<HTMLDivElement>;

  screenWidth = 0;
  private animSub?: Subscription;

  constructor(
    private el: ElementRef,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth = window.innerWidth;
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.screenWidth = window.innerWidth;
    }
  }

  ngAfterViewInit() {
    if (this.mediaType === 'video' && !this.videoSrc) {
      console.warn('BettercustomDualComponent: mediaType is "video" pero falta videoSrc.');
    }

    // Mantengo la suscripción al LoaderService si lo necesitás para otra lógica
    if (isPlatformBrowser(this.platformId)) {
      this.animSub = this.loaderService.animationsEnabled$.subscribe(() => {
        // No hay animaciones GSAP ahora
      });
    }
  }

  ngOnDestroy() {
    this.animSub?.unsubscribe();
  }

  getImageStyle() {
    if (!isPlatformBrowser(this.platformId)) return {};
    return this.screenWidth >= 768 ? { width: this.imageWidth } : {};
  }

  getTextStyle() {
    if (!isPlatformBrowser(this.platformId)) return {};
    return this.screenWidth >= 768 ? { width: this.textWidth } : {};
  }

  getBlockHeight() {
    if (!isPlatformBrowser(this.platformId)) return {};
    const isDesktop = this.screenWidth >= 768;
    if (isDesktop) {
      return { height: this.height };
    } else if (this.mobileHeight) {
      return { height: this.mobileHeight };
    } else {
      return {};
    }
  }

  getCombinedStyle(base: { [key: string]: any }) {
    return this.useAspectRatio
      ? base
      : {
          ...base,
          ...this.getBlockHeight(),
        };
  }

  getImageOrderClasses() {
    const mobile = this.mobileOrder === 'image-first' ? 'order-1' : 'order-2';
    const desktop = this.desktopOrder === 'image-first' ? 'md:order-1' : 'md:order-2';
    return `${mobile} ${desktop}`;
  }

  getTextOrderClasses() {
    const mobile = this.mobileOrder === 'text-first' ? 'order-1' : 'order-2';
    const desktop = this.desktopOrder === 'text-first' ? 'md:order-1' : 'md:order-2';
    return `${mobile} ${desktop}`;
  }
}
