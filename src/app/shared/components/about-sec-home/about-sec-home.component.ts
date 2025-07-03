import {
  Component,
  Input,
  AfterViewInit,
  ViewChildren,
  ElementRef,
  QueryList,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-about-sec-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-sec-home.component.html',
  styleUrl: './about-sec-home.component.css',
})
export class AboutSecHomeComponent implements AfterViewInit, OnDestroy {

  @Input() AboutData: {
    title: string;
    text: string;
    image: string;
    imageOrderMobile: string;
    imageOrderDesktop: string;
    textOrderMobile: string;
    textOrderDesktop: string;
  }[] = [];

  @ViewChildren('animatedTitle') titles!: QueryList<ElementRef<HTMLHeadingElement>>;
  @ViewChildren('parallaxImg') parallaxImgs!: QueryList<ElementRef<HTMLImageElement>>;

  ngAfterViewInit(): void {
    this.animateTitles();
    this.setupParallaxImages();
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  animateTitles() {
    this.titles.forEach((titleEl: ElementRef<HTMLHeadingElement>) => {
      const el = titleEl.nativeElement;
      const text = el.innerText.trim();
      el.innerHTML = '';

      const groupSize = 3;
      const groups: HTMLElement[] = [];

      const letters: HTMLSpanElement[] = text.split('').map((char: string) => {
        const span = document.createElement('span');
        span.innerText = char;
        span.style.display = 'inline-block';
        return span;
      });

      for (let i = 0; i < letters.length; i += groupSize) {
        const groupWrapper = document.createElement('span');
        groupWrapper.style.display = 'inline-block';

        const group = letters.slice(i, i + groupSize);
        group.forEach((letter) => groupWrapper.appendChild(letter));

        el.appendChild(groupWrapper);
        groups.push(groupWrapper);
      }

      gsap.from(groups, {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.4,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'restart none none reset',
        }
      });
    });
  }

  setupParallaxImages() {
    this.parallaxImgs.forEach((imgRef) => {
      const image = imgRef.nativeElement;

      gsap.timeline({
        scrollTrigger: {
          trigger: image,
          scrub: true,
        },
      })
        .fromTo(
          image,
          { yPercent: -30 },
          { yPercent: 30, ease: 'none' }
        );
    });
  }
}
