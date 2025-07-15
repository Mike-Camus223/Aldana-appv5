import {
  Component,
  Input,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WordRevealDirective } from '../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../utils/directives/fadeupletter.directive';
import { VideoComponent } from '../video/video.component';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LoaderService } from '../../../core/services/utils/loader.service';
import { Subscription } from 'rxjs';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-bettercustom-dual',
  standalone: true,
  imports: [CommonModule, WordRevealDirective, FadeUpLetterDirective, VideoComponent],
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
 
  
  @ViewChild('parallaxImage', { static: false }) parallaxImage!: ElementRef<HTMLImageElement>;
  @ViewChild('parallaxContainer', { static: false }) parallaxContainer!: ElementRef<HTMLDivElement>;

  screenWidth = window.innerWidth;
  private animSub?: Subscription;

  constructor(private el: ElementRef, private loaderService: LoaderService) {}

  @HostListener('window:resize')
  onResize() {
    this.screenWidth = window.innerWidth;
  }

  ngAfterViewInit() {
    if (this.mediaType === 'video' && !this.videoSrc) {
      console.warn('BettercustomDualComponent: mediaType is set to "video" but videoSrc is missing.');
    }

    this.animSub = this.loaderService.animationsEnabled$.subscribe((enabled) => {
      if (enabled && this.mediaType === 'image') {
        this.initParallax();
      }
    });
  }

  ngOnDestroy() {
    this.animSub?.unsubscribe();
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private initParallax() {
    const imageEl = this.parallaxImage?.nativeElement;
    const containerEl = this.parallaxContainer?.nativeElement;
    if (!imageEl || !containerEl) return;

    const isDesktop = this.screenWidth >= 768;

    gsap.fromTo(imageEl,
      {
        scale: isDesktop ? 1.3 : 1.5,
        y: isDesktop ? '-10%' : '0%'
      },
      {
        scale: 1,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: this.el.nativeElement,
          start: 'top 90%',
          toggleActions: 'play none none none'
        }
      }
    );

    if (isDesktop) {
      gsap.fromTo(imageEl,
        { y: '-10%' },
        {
          y: '10%',
          ease: 'none',
          scrollTrigger: {
            trigger: this.el.nativeElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2,
          }
        }
      );
      gsap.fromTo(containerEl,
        { y: '0%' },
        {
          y: '-10%',
          ease: 'none',
          scrollTrigger: {
            trigger: this.el.nativeElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          }
        }
      );
    } else {
      gsap.fromTo(imageEl,
        { y: '-3%' },
        {
          y: '3%',
          ease: 'none',
          scrollTrigger: {
            trigger: this.el.nativeElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          }
        }
      );
    }
  }

  getImageStyle() {
    return this.screenWidth >= 768 ? { width: this.imageWidth } : {};
  }

  getTextStyle() {
    return this.screenWidth >= 768 ? { width: this.textWidth } : {};
  }

  getBlockHeight() {
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
    return {
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
