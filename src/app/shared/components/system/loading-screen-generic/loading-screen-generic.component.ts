import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import gsap from 'gsap';
import { LoaderService } from '../../../../core/services/utils/loader.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading-screen-generic',
  standalone: true,
  templateUrl: './loading-screen-generic.component.html',
  styleUrls: ['./loading-screen-generic.component.css']
})
export class LoadingScreenGenericComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('loadingScreen') loadingScreenRef!: ElementRef;
  @ViewChild('logo') logoRef!: ElementRef;

  private timeline?: gsap.core.Timeline;
  private currentLoaderSubscription?: Subscription;
  private navigationStateSubscription?: Subscription;

  public isScrollBlocked = false;
  public isAnimating = false;
  private hasNavigationEnded = false;
  private isIntroComplete = false;

  private wheelListener?: (event: WheelEvent) => void;
  private touchMoveListener?: (event: TouchEvent) => void;
  private keydownListener?: (event: KeyboardEvent) => void;

  constructor(
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.hideLoaderDOM();

      // Listen for loader selection
      this.currentLoaderSubscription = this.loaderService.currentLoader$.subscribe(loader => {
        if (loader === 'generic' && !this.isAnimating) {
          this.playIntro();
        }
      });

      // Listen for navigation progress state
      this.navigationStateSubscription = this.loaderService.navigationState$.subscribe(state => {
        if (state === 'end') {
          this.onNavigationEndReceived();
        }
      });
    }
  }

  private hideLoaderDOM(): void {
    if (!isPlatformBrowser(this.platformId) || !this.loadingScreenRef) return;
    const screen = this.loadingScreenRef.nativeElement;
    screen.style.display = 'none';
    screen.style.pointerEvents = 'none';
    screen.style.opacity = '0';
    screen.style.zIndex = '-1';
  }

  private showLoaderDOM(): void {
    if (!isPlatformBrowser(this.platformId) || !this.loadingScreenRef) return;
    const screen = this.loadingScreenRef.nativeElement;
    screen.style.display = 'flex';
    screen.style.pointerEvents = 'auto';
    screen.style.visibility = 'visible';
    screen.style.zIndex = '9999';
  }

  private playIntro(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isAnimating = true;
    this.hasNavigationEnded = false;
    this.isIntroComplete = false;

    this.blockScroll();
    this.showLoaderDOM();

    const screen = this.loadingScreenRef.nativeElement;
    const logo = this.logoRef.nativeElement;

    if (this.timeline) this.timeline.kill();
    this.timeline = gsap.timeline();

    this.loaderService.clearAllAnimations();

    // Reset styles for a clean GSAP start
    gsap.set(screen, { opacity: 1, display: 'flex' });
    gsap.set(logo, { opacity: 0, y: 20 });

    this.timeline
      .to(logo, { 
        duration: 0.4, 
        opacity: 1, 
        y: 0, 
        ease: 'power2.out',
        onComplete: () => {
          this.isIntroComplete = true;
          if (this.hasNavigationEnded) {
            this.playOutro();
          }
        }
      });
  }

  private onNavigationEndReceived(): void {
    this.hasNavigationEnded = true;
    if (this.isIntroComplete) {
      this.playOutro();
    }
  }

  private playOutro(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const screen = this.loadingScreenRef.nativeElement;
    const logo = this.logoRef.nativeElement;

    if (this.timeline) this.timeline.kill();
    this.timeline = gsap.timeline();

    this.timeline
      .to(logo, { 
        duration: 0.3, 
        opacity: 0, 
        y: -20, 
        ease: 'power2.in' 
      })
      .to(screen, { 
        duration: 0.3, 
        opacity: 0, 
        ease: 'power2.in',
        onComplete: () => {
          this.hideLoaderDOM();
          this.unblockScroll();
          this.loaderService.finish('generic');
          this.isAnimating = false;
        }
      }, '-=0.15');
  }

  private blockScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isScrollBlocked) return;
    this.isScrollBlocked = true;

    if (document.body) {
      document.body.classList.add('reserve-scrollbar-space');
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    }

    this.wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    this.touchMoveListener = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    this.keydownListener = (e: KeyboardEvent) => {
      const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (keys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('wheel', this.wheelListener, { passive: false });
    document.addEventListener('touchmove', this.touchMoveListener, { passive: false });
    document.addEventListener('keydown', this.keydownListener, { capture: true });
  }

  private unblockScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.isScrollBlocked) return;
    this.isScrollBlocked = false;

    if (document.body) {
      document.body.classList.remove('reserve-scrollbar-space');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('overscrollBehavior');
    }

    if (this.wheelListener) {
      document.removeEventListener('wheel', this.wheelListener);
    }
    if (this.touchMoveListener) {
      document.removeEventListener('touchmove', this.touchMoveListener);
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener, { capture: true } as any);
    }
  }

  ngOnDestroy(): void {
    this.unblockScroll();
    if (this.currentLoaderSubscription) {
      this.currentLoaderSubscription.unsubscribe();
    }
    if (this.navigationStateSubscription) {
      this.navigationStateSubscription.unsubscribe();
    }
    if (this.timeline) {
      this.timeline.kill();
    }
  }
}
//   }
// }