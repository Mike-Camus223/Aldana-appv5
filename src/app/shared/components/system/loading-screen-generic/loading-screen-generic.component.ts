 import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
 import { isPlatformBrowser } from '@angular/common';
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

   constructor(
     private loaderService: LoaderService,
     @Inject(PLATFORM_ID) private platformId: Object
   ) {}

   ngOnInit(): void {}

   ngAfterViewInit(): void {
     this.hideLoader();

     this.loaderSubscription = this.loaderService.currentLoader$.subscribe(loader => {
       if (loader === 'generic' && !this.isAnimating) {
         this.isAnimating = true;
         this.playAnimation();
       } else if (loader !== 'generic' && !this.isAnimating) {
       } else if (this.isAnimating) {
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
     if (!isPlatformBrowser(this.platformId)) return;
    
     const screen = this.loadingScreenRef.nativeElement;
     const logo = this.logoRef.nativeElement;

     if (this.timeline) this.timeline.kill();

     this.loaderService.clearAllAnimations();

     window.scrollTo(0, 0);
     this.isScrollBlocked = true;
     window.addEventListener('scroll', this.preventScroll, { passive: false });

     this.showLoader();
    
     gsap.set(screen, { opacity: 1, display: 'flex' });
     gsap.set(logo, { opacity: 0, y: 20 });
    
     gsap.timeline()
       .to(logo, { 
         duration: 0.3, 
         opacity: 1, 
         y: 0, 
         ease: 'power2.out'
       })
       .to({}, { 
         duration: 0.5
       })
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
           this.hideLoader();
           this.isScrollBlocked = false;
           window.removeEventListener('scroll', this.preventScroll);
           this.loaderService.finish('generic');
           this.isAnimating = false;
          
           if (typeof ScrollTrigger !== 'undefined') {
             ScrollTrigger.refresh();
           }
         }
       });
   }

   private preventScroll = (): void => {
     if (this.isScrollBlocked) {
       window.scrollTo(0, 0);
     }
   };

   ngOnDestroy(): void {
     if (this.loaderSubscription) {
       this.loaderSubscription.unsubscribe();
     }
   }
 }













// import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import gsap from 'gsap';
// import ScrollTrigger from 'gsap/ScrollTrigger';
// import { LoaderService } from '../../../../core/services/utils/loader.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-loading-screen-generic',
//   standalone: true,
//   templateUrl: './loading-screen-generic.component.html',
//   styleUrls: ['./loading-screen-generic.component.css']
// })
// export class LoadingScreenGenericComponent implements OnInit, OnDestroy, AfterViewInit {
//   @ViewChild('loadingScreen') loadingScreenRef!: ElementRef;
//   @ViewChild('logo') logoRef!: ElementRef;

//   private timeline!: gsap.core.Timeline;
//   private loaderSubscription?: Subscription;
//   private isScrollBlocked = false;
//   private isAnimating = false;

//   constructor(
//     private loaderService: LoaderService,
//     @Inject(PLATFORM_ID) private platformId: Object
//   ) {}

//   ngOnInit(): void {}

//   ngAfterViewInit(): void {
//     this.hideLoader();

//     this.loaderSubscription = this.loaderService.currentLoader$.subscribe(async loader => {
//       if (loader === 'generic' && !this.isAnimating) {
//         this.isAnimating = true;
//         await this.playAnimation(); // 👈 esperamos que la animación termine
//       }
//     });
//   }

//   private hideLoader(): void {
//     const screen = this.loadingScreenRef.nativeElement;
//     screen.style.display = 'none';
//     screen.style.pointerEvents = 'none';
//     screen.style.opacity = '0';
//     screen.style.zIndex = '-1';
//   }

//   private showLoader(): void {
//     const screen = this.loadingScreenRef.nativeElement;
//     screen.style.display = 'flex';
//     screen.style.pointerEvents = 'auto';
//     screen.style.visibility = 'visible';
//     screen.style.zIndex = '9999';
//   }

//   private async playAnimation(): Promise<void> {
//     if (!isPlatformBrowser(this.platformId)) return;
    
//     const screen = this.loadingScreenRef.nativeElement;
//     const logo = this.logoRef.nativeElement;

//     if (this.timeline) this.timeline.kill();
//     this.loaderService.clearAllAnimations();

//     window.scrollTo(0, 0);
//     this.isScrollBlocked = true;
//     window.addEventListener('scroll', this.preventScroll, { passive: false });

//     this.showLoader();

//     gsap.set(screen, { opacity: 1, display: 'flex' });
//     gsap.set(logo, { opacity: 1, y: 0 });

//     this.timeline = gsap.timeline();

//     this.timeline
//       // El SVG ya visible, mientras corre la animación CSS
//       .to({}, { duration: 1.4 }) // tiempo para el stroke/fill del SVG
//       // Suave salida
//       .to(logo, { 
//         duration: 0.3, 
//         opacity: 0, 
//         y: -20, 
//         ease: 'power2.in' 
//       })
//       .to(screen, { 
//         duration: 0.3, 
//         opacity: 0, 
//         ease: 'power2.in' 
//       }, "-=0.15");

//     // 👇 Esperamos a que termine la animación
//     await new Promise<void>(resolve => {
//       this.timeline.eventCallback('onComplete', () => {
//         resolve();
//       });
//     });

//     // 👇 Una vez terminada, ocultamos y liberamos scroll
//     this.hideLoader();
//     this.isScrollBlocked = false;
//     window.removeEventListener('scroll', this.preventScroll);
//     this.loaderService.finish('generic');
//     this.isAnimating = false;

//     if (typeof ScrollTrigger !== 'undefined') {
//       ScrollTrigger.refresh();
//     }
//   }

//   private preventScroll = (): void => {
//     if (this.isScrollBlocked) {
//       window.scrollTo(0, 0);
//     }
//   };

//   ngOnDestroy(): void {
//     if (this.loaderSubscription) {
//       this.loaderSubscription.unsubscribe();
//     }
//   }
// }