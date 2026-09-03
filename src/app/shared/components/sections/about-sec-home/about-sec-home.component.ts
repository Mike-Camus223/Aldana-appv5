import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  QueryList,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subject, takeUntil } from 'rxjs';
import { LoaderService } from '../../../../core/services/loader.service';
import { WordRevealDirective } from '../../../directives/animations/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../directives/animations/fadeupletter.directive';
import { RouterModule } from '@angular/router';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

@Component({
  selector: 'app-about-sec-home',
  standalone: true,
  imports: [
    WordRevealDirective,
    FadeUpLetterDirective,
    RouterModule
],
  templateUrl: './about-sec-home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './about-sec-home.component.css',
})
export class AboutSecHomeComponent implements AfterViewInit, OnDestroy {

  @ViewChildren('aboutImage') aboutImages!: QueryList<ElementRef>;

  private destroy$ = new Subject<void>();

  constructor(private loaderService: LoaderService) {}

  ngAfterViewInit(): void {
    if ((this.loaderService as any).animationsEnabled$) {
      (this.loaderService as any).animationsEnabled$
        .pipe(takeUntil(this.destroy$))
        .subscribe((enabled: boolean) => {
          if (enabled) this.setupImageAnimations();
        });
    } else {
      this.setupImageAnimations();
    }
  }

  private setupImageAnimations(): void {
    this.aboutImages.forEach((imgRef) => {
      gsap.fromTo(
        imgRef.nativeElement,
        { scale: 1.2 },
        {
          scale: 1,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: imgRef.nativeElement,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
