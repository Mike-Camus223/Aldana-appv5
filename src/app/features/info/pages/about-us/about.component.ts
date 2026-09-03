import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { RouterModule } from '@angular/router';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { LucideAngularModule } from 'lucide-angular';
import { BreadcrumbComponent } from "../../../../shared/layouts/components/breadcrumb/breadcrump.component";
import { ReelsSectionComponent } from "../../../../shared/components/sections/reels-section/reels-section.component";
import { CardInitAnimationDirective } from '../../../../shared/directives/animations/card-init-animation.directive';
import { FadeUpLetterDirective } from '../../../../shared/directives/animations/fadeupletter.directive';
import { WordRevealDirective } from '../../../../shared/directives/animations/word-reveal.directive';
import { AppMenuItem } from '../../../../shared/models/app-menu-item.model';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    RouterModule,
    BreadcrumbComponent,
    CardInitAnimationDirective,
    LucideAngularModule,
    ReelsSectionComponent,
    WordRevealDirective,
    FadeUpLetterDirective
  ],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './about.component.css'
})
export class AboutComponent implements AfterViewInit {
  @ViewChild('animatedSection', { static: true }) animatedSection!: ElementRef;
  @ViewChild('greenCard', { static: true }) greenCard!: ElementRef;
  @ViewChild('blueCard', { static: true }) blueCard!: ElementRef;
  @ViewChild('redCard', { static: true }) redCard!: ElementRef;
  @ViewChild('valuesSection', { static: true }) valuesSection!: ElementRef;
  @ViewChild('leftColumn', { static: true }) leftColumn!: ElementRef;
  @ViewChild('rightColumn', { static: true }) rightColumn!: ElementRef;
  @ViewChild('centerImage', { static: true }) centerImage!: ElementRef;

  breadcrumbItemsAbout: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'ACERCA DE MÍ', route: '/acerca-de-mi' }
  ];

  ngAfterViewInit(): void {
    this.initScrollAnimations();
    this.initFanAnimation();
  }

  reinitializeAnimations(): void {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    
    setTimeout(() => {
      this.initScrollAnimations();
      this.initFanAnimation();
    }, 100);
  }

  clearAnimations(): void {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  private initScrollAnimations(): void {
    ScrollTrigger.matchMedia({
      "(min-width: 1280px)": () => {
        const tl = gsap.timeline({
          defaults: { ease: "power1.inOut" },
          scrollTrigger: {
            trigger: this.animatedSection.nativeElement,
            start: "top top",
            end: "+=2500",
            scrub: 1.3,
            pin: true,
            pinSpacing: true,
            markers: false
          }
        });

        gsap.set([
          this.greenCard.nativeElement,
          this.blueCard.nativeElement,
          this.redCard.nativeElement
        ], {
          y: 230,
          opacity: 0,
          scale: 0.95,
          rotation: 2
        });

        tl.to(this.greenCard.nativeElement, {
          y: -60,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "back.out(1.1)"
        }, 0);

        tl.to(this.blueCard.nativeElement, {
          y: -60,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "back.out(1.1)"
        }, 0.5);

        tl.to(this.redCard.nativeElement, {
          y: -60,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "back.out(1.1)"
        }, 1.0);
      },

      "(min-width: 768px) and (max-width: 1279px)": () => {
        const tl = gsap.timeline({
          defaults: { ease: "power1.inOut" },
          scrollTrigger: {
            trigger: this.animatedSection.nativeElement,
            start: "top top",
            end: "+=2500",
            scrub: 1.3,
            pin: true,
            pinSpacing: true,
            markers: false
          }
        });

        gsap.set([
          this.greenCard.nativeElement,
          this.blueCard.nativeElement,
          this.redCard.nativeElement
        ], {
          y: 120,
          opacity: 0,
          scale: 0.95,
          rotation: 2
        });

        tl.to(this.greenCard.nativeElement, {
          y: 10,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1
        }, 0);

        tl.to(this.blueCard.nativeElement, {
          y: 10,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1
        }, 0.5);

        tl.to(this.redCard.nativeElement, {
          y: 10,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1
        }, 1.0);
      },

      "(max-width: 767px)": () => {
        const tl = gsap.timeline({
          defaults: { ease: "power1.inOut" },
          scrollTrigger: {
            trigger: this.animatedSection.nativeElement,
            start: "top top",
            end: "+=1618",
            scrub: 1.3,
            pin: true,
            pinSpacing: true,
            markers: false
          }
        });

        gsap.set([
          this.greenCard.nativeElement,
          this.blueCard.nativeElement,
          this.redCard.nativeElement
        ], {
          y: 120,
          opacity: 0,
          scale: 0.95,
          rotation: 2
        });

        tl.to(this.greenCard.nativeElement, {
          y: 60,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1
        }, 0);

        tl.to(this.blueCard.nativeElement, {
          y: 60,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1
        }, 0.5);

        tl.to(this.redCard.nativeElement, {
          y: 60,
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1
        }, 1.0);
      }
    });
  }

  private initFanAnimation(): void {
    const leftValues = this.leftColumn?.nativeElement.querySelectorAll('.value-item') || [];
    const rightValues = this.rightColumn?.nativeElement.querySelectorAll('.value-item') || [];
    const allMobileValues = this.valuesSection.nativeElement.querySelectorAll('.block .value-item');

    ScrollTrigger.matchMedia({
      "(min-width: 1025px)": () => {
        gsap.set([leftValues, rightValues], {
          opacity: 0,
          scale: 0.8,
          x: 0
        });

        ScrollTrigger.create({
          trigger: this.valuesSection.nativeElement,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to([leftValues, rightValues], {
              opacity: 1,
              scale: 1,
              duration: 1.2,
              ease: "power2.out",
              stagger: 0.2
            });
          }
        });
      },

      "(min-width: 769px) and (max-width: 1024px)": () => {
        gsap.set(allMobileValues, {
          opacity: 0,
          y: 30,
          scale: 0.95
        });

        ScrollTrigger.batch(allMobileValues, {
          interval: 0.3,
          batchMax: 2,
          start: "top 80%",
          onEnter: batch => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.2,
              duration: 1,
              ease: "power3.out"
            });
          }
        });
      },

      "(max-width: 768px)": () => {
        gsap.set(allMobileValues, {
          opacity: 0,
          y: -40,
          scale: 0.9
        });

        ScrollTrigger.batch(allMobileValues, {
          interval: 0.2,
          batchMax: 1,
          start: "top 85%",
          onEnter: batch => {
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.15,
              duration: 0.8,
              ease: "power2.out"
            });
          }
        });
      }
    });
  }
}
