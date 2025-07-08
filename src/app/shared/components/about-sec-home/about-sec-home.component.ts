import {
  Component,
  Input,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  QueryList,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subject, takeUntil } from 'rxjs';
import { WordRevealDirective } from '../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../utils/directives/fadeupletter.directive';
import { LoaderService } from '../../../core/services/utils/loader.service';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-about-sec-home',
  standalone: true,
  imports: [CommonModule, WordRevealDirective, FadeUpLetterDirective],
  templateUrl: './about-sec-home.component.html',
  styleUrl: './about-sec-home.component.css',
})
export class AboutSecHomeComponent implements AfterViewInit, OnDestroy {
  @Input() AboutData: {
    maxWidthTittle: string;
    title: string;
    text: string;
    image: string;
    imageOrderMobile: string;
    imageOrderDesktop: string;
    textOrderMobile: string;
    textOrderDesktop: string;
    overlapTitle?: boolean;
    buttonText?: string;
    buttonUrl?: string;
    titleOffsetClass?: string;
  }[] = [];

  @ViewChildren('aboutImage') aboutImages!: QueryList<ElementRef>;

  private destroy$ = new Subject<void>();

  constructor(private loaderService: LoaderService) {}

  ngAfterViewInit(): void {
    this.loaderService.animationsEnabled$
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        if (enabled) {
          this.setupImageAnimations();
        }
      });
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