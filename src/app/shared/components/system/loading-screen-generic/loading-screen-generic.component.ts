import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
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

  private timeline!: gsap.core.Timeline;
  private loaderSubscription?: Subscription;
  private isScrollBlocked = false;

  constructor(private loaderService: LoaderService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.hideLoader();

    this.loaderSubscription = this.loaderService.currentLoader$.subscribe(loader => {
      if (loader === 'generic') {
        this.playAnimation();
      }
    });
  }

  private hideLoader(): void {
    const screen = this.loadingScreenRef.nativeElement;

    screen.style.display = 'none';
    screen.style.pointerEvents = 'none';
    screen.style.opacity = '0';
    screen.style.zIndex = '-1';
  }

  private showLoader(): void {
    const screen = this.loadingScreenRef.nativeElement;

    screen.style.display = 'flex';
    screen.style.pointerEvents = 'auto';
    screen.style.visibility = 'visible';
    screen.style.zIndex = '9999';
  }

  private playAnimation(): void {
    const screen = this.loadingScreenRef.nativeElement;
    const logo = this.logoRef.nativeElement;

    if (this.timeline) this.timeline.kill();

    this.loaderService.clearAllAnimations();

    window.scrollTo(0, 0);
    this.isScrollBlocked = true;
    window.addEventListener('scroll', this.preventScroll, { passive: false });

    this.showLoader();
    gsap.set(screen, { opacity: 0 });
    gsap.set(logo, { opacity: 0, y: 20 });

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.hideLoader();

        this.isScrollBlocked = false;
        window.removeEventListener('scroll', this.preventScroll);

        this.loaderService.finish('generic');
        
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }
    });

    this.timeline
      .to(screen, { duration: 0.3, opacity: 1, ease: 'power2.out' })
      .to(logo, { duration: 0.35, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.15')
      .to({}, { duration: 0.3 })
      .to(logo, { duration: 0.25, opacity: 0, y: 20, ease: 'power2.in' })
      .to(screen, {
        duration: 0.4,
        opacity: 0,
        ease: 'power2.in',
        onComplete: () => {
          this.hideLoader();
        }
      });
  }

  private preventScroll = (): void => {
    if (this.isScrollBlocked) {
      window.scrollTo(0, 0);
    }
  };

  ngOnDestroy(): void {
    if (this.timeline) this.timeline.kill();
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }

    if (this.loadingScreenRef?.nativeElement) {
      this.hideLoader();
    }

    this.isScrollBlocked = false;
    window.removeEventListener('scroll', this.preventScroll);
  }
}
