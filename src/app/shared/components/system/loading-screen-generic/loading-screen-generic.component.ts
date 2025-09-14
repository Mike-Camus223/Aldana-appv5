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
  private isAnimating = false;

  constructor(private loaderService: LoaderService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.hideLoader();

    this.loaderSubscription = this.loaderService.currentLoader$.subscribe(loader => {
      console.log('🎬 LoadingScreenGeneric - Received loader state:', loader);
      
      if (loader === 'generic' && !this.isAnimating) {
        console.log('🎬 LoadingScreenGeneric - Playing animation');
        this.isAnimating = true;
        this.playAnimation();
      } else if (loader !== 'generic' && !this.isAnimating) {
        console.log('🎬 LoadingScreenGeneric - Not showing (loader is not generic)');
      } else if (this.isAnimating) {
        console.log('🎬 LoadingScreenGeneric - Ignoring state change - animation in progress');
      }
    });
  }

  private hideLoader(): void {
    const screen = this.loadingScreenRef.nativeElement;

    console.log('🎬 LoadingScreenGeneric - hideLoader() called');
    console.trace('🎬 LoadingScreenGeneric - hideLoader() stack trace:');
    screen.style.display = 'none';
    screen.style.pointerEvents = 'none';
    screen.style.opacity = '0';
    screen.style.zIndex = '-1';
  }

  private showLoader(): void {
    const screen = this.loadingScreenRef.nativeElement;

    console.log('🎬 LoadingScreenGeneric - showLoader() called');
    screen.style.display = 'flex';
    screen.style.pointerEvents = 'auto';
    screen.style.visibility = 'visible';
    screen.style.zIndex = '9999';
    console.log('🎬 LoadingScreenGeneric - Loader shown with styles:', {
      display: screen.style.display,
      opacity: screen.style.opacity,
      zIndex: screen.style.zIndex
    });
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
    // Pantalla blanca visible sin fade inicial
    gsap.set(screen, { opacity: 1 });
    gsap.set(logo, { opacity: 0, y: 20 });

    console.log('🎬 LoadingScreenGeneric - Creating timeline');
    this.timeline = gsap.timeline({
      onComplete: () => {
        console.log('🎬 LoadingScreenGeneric - Timeline completed - calling hideLoader and finish');
        this.hideLoader();

        this.isScrollBlocked = false;
        window.removeEventListener('scroll', this.preventScroll);

        this.loaderService.finish('generic');
        
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
        this.isAnimating = false;
      },
      onStart: () => {
        console.log('🎬 LoadingScreenGeneric - Timeline started');
      },
      onUpdate: () => {
        console.log('🎬 LoadingScreenGeneric - Timeline updating');
      }
    });

    console.log('🎬 LoadingScreenGeneric - Starting animation sequence');
    this.timeline
      // Solo el logo hace fade-in al inicio
      .to(logo, { 
        duration: 0.35, 
        opacity: 1, 
        y: 0, 
        ease: 'power2.out',
        onStart: () => console.log('🎬 Logo fade-in started'),
        onComplete: () => console.log('🎬 Logo fade-in completed')
      })
      .to({}, { 
        duration: 0.3,
        onComplete: () => console.log('🎬 Delay completed')
      })
      // Luego el logo desaparece
      .to(logo, { 
        duration: 0.25, 
        opacity: 0, 
        y: 20, 
        ease: 'power2.in',
        onStart: () => console.log('🎬 Logo fade-out started'),
        onComplete: () => console.log('🎬 Logo fade-out completed')
      })
      // Al final recién aplicamos el fade-out global de la pantalla
      .to(screen, {
        duration: 0.4,
        opacity: 0,
        ease: 'power2.in',
        onStart: () => console.log('🎬 Screen fade-out started'),
        onComplete: () => {
          console.log('🎬 Screen fade-out completed');
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
    console.log('🎬 LoadingScreenGeneric - ngOnDestroy called, isAnimating:', this.isAnimating);
    
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }

    // NO llamar hideLoader() ni interrumpir animaciones en ngOnDestroy
    // La animación se completará naturalmente
  }
}
