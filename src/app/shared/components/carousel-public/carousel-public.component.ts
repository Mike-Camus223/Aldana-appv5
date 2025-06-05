import { Component, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

interface Product {
  image: string;
  title: string;
  description: string;
  button: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-carousel-public',
  standalone: true,
  imports: [CommonModule, CarouselModule, ButtonModule,RouterModule],
  templateUrl: './carousel-public.component.html',
  styleUrls: ['./carousel-public.component.css'],
})
export class CarouselPublicComponent implements AfterViewInit, OnDestroy {
  products: Product[] = [
    {
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format',
      title: 'Vestidos de novia únicos',
      description: 'Explorá nuestra exclusiva colección de vestidos de novia diseñados para ese día tan especial.',
      button: 'Ver galería',
      icon: 'fa-camera',
      route: '/novias',
    },
    {
      image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=1200&auto=format',
      title: 'Nuestra galería de moda',
      description: 'Descubrí la galería profesional de ropa donde cada prenda cuenta una historia de estilo y elegancia.',
      button: 'Ver galería',
      icon: 'fa-camera',
      route: '/galeria',
    },
    {
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format',
      title: 'Conocenos mejor',
      description: 'Descubrí quiénes somos, qué nos mueve y por qué hacemos lo que hacemos.',
      button: 'Nuestra historia',
      icon: 'fa-brands fa-envira',
      route: '/acerca-de',
    },
  ];

  currentIndex = 0;
  zooming = true;

  private autoplayInterval: any = null;
  private inactivityTimeout: any = null;
  private observer: IntersectionObserver | null = null;
  private isVisible = true;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.setupVisibilityObserver();
    this.startAutoplay();
  }

  setupVisibilityObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;

          if (this.isVisible) {
            this.startAutoplay();
          } else {
            this.clearAutoplay();
          }
        });
      },
      { threshold: 0.3 }
    );

    this.observer.observe(this.el.nativeElement);
  }

  startAutoplay() {
    if (this.autoplayInterval) return;

    this.zooming = true;
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, 4000);
  }

  clearAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    this.zooming = false;
  }

  nextSlide() {
    this.zooming = false;
    this.currentIndex = (this.currentIndex + 1) % this.products.length;

    setTimeout(() => {
      this.zooming = true;
    }, 100);
  }

  onUserInteraction() {
    this.clearAutoplay();

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    this.inactivityTimeout = setTimeout(() => {
      if (this.isVisible) {
        this.startAutoplay();
      }
    }, 3000);
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
