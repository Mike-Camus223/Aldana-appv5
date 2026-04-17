import { Component, AfterViewInit, ElementRef } from '@angular/core';
import { gsap } from 'gsap';

@Component({
  selector: 'app-items-collection',
  templateUrl: './items-collection.component.html',
  styleUrl: './items-collection.component.css'
})
export class ItemsCollectionComponent implements AfterViewInit {

  product = {
    name: 'AMELIA',
    description: 'Amelia is a modern take on classic volume...',
    media: 'assets/img/amelia.jpg',
    slug: '/novias-colecciones/jardin-secreto/vestido-cala'
  };

  isVideo = false;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    const tl = gsap.timeline();

    tl.from(this.el.nativeElement.querySelector('h1'), {
      y: 80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });

    tl.from(this.el.nativeElement.querySelectorAll('p, a, button'), {
      y: 40,
      opacity: 0,
      stagger: 0.1,
      duration: 0.8,
      ease: 'power2.out'
    }, "-=0.6");

    tl.from(this.el.nativeElement.querySelector('img, video'), {
      scale: 1.1,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    }, "-=1");
  }
}