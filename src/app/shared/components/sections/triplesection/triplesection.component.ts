import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';

import {
  ArrowLeft,
  ArrowRight,
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider
} from 'lucide-angular';

import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { LoaderService } from '../../../../core/services/utils/loader.service';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';

gsap.registerPlugin(DrawSVGPlugin);

@Component({
  selector: 'app-triplesection',
  imports: [LucideAngularModule, RouterModule],
  templateUrl: './triplesection.component.html',
  styleUrl: './triplesection.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ArrowLeft, ArrowRight })
    }
  ]
})
export class TriplesectionComponent implements AfterViewInit, OnDestroy {

  // ── Imágenes de los paneles inferiores ───────────────────────────────────────
  @ViewChild('leftImage')    leftImage!:    ElementRef<HTMLImageElement>;
  @ViewChild('rightImage')   rightImage!:   ElementRef<HTMLImageElement>;

  // ── Contenido de texto de los paneles inferiores ─────────────────────────────
  @ViewChild('leftContent')  leftContent!:  ElementRef<HTMLElement>;
  @ViewChild('rightContent') rightContent!: ElementRef<HTMLElement>;

  // ── Botones (sólo para buscar el panel padre si fuera necesario) ─────────────
  @ViewChild('leftArrowBtn')  leftArrowBtn!:  ElementRef;
  @ViewChild('rightArrowBtn') rightArrowBtn!: ElementRef;

  // ── Logo y tagline ───────────────────────────────────────────────────────────
  @ViewChild('logoSvg')     logoSvg!:     ElementRef<SVGSVGElement>;
  @ViewChild('heroTagline') heroTagline!: ElementRef<HTMLElement>;

  // ── Videos ───────────────────────────────────────────────────────────────────
  @ViewChild('video1') video1!: ElementRef<HTMLVideoElement>;
  @ViewChild('video2') video2!: ElementRef<HTMLVideoElement>;
  @ViewChild('video3') video3!: ElementRef<HTMLVideoElement>;

  private animationSubscription?: Subscription;
  private hasAnimated = false;
  private videoObserver?: IntersectionObserver;

  constructor(private loaderService: LoaderService) {}

  ngAfterViewInit(): void {
    // Iniciar videos cuanto antes — no depender del observer para el primer play
    this.startVideos();
    this.setupVideoObserver();

    this.animationSubscription =
      this.loaderService.animationsEnabled$
        .subscribe(enabled => {
          if (!enabled || this.hasAnimated) return;
          this.hasAnimated = true;
          this.animateHero();
          this.animateBottomPanels();
        });
  }

  ngOnDestroy(): void {
    this.animationSubscription?.unsubscribe();
    this.videoObserver?.disconnect();
  }

  // ─── VIDEOS ──────────────────────────────────────────────────────────────────

  /** Fuerza el play inicial en todos los videos presentes en el DOM. */
  private startVideos(): void {
    const videos = [this.video1, this.video2, this.video3]
      .filter(v => v?.nativeElement)
      .map(v => v.nativeElement);

    videos.forEach(video => {
      video.muted = true;
      video.loop  = true;
      video.play().catch(() => {
        // Algunos browsers bloquean autoplay; el observer lo reintentará
      });
    });
  }

  /**
   * Pausa los videos cuando la sección sale del viewport y los reanuda
   * con anticipación (rootMargin: 200px) antes de que vuelvan a ser visibles.
   */
  private setupVideoObserver(): void {
    const videos = [this.video1, this.video2, this.video3]
      .filter(v => v?.nativeElement)
      .map(v => v.nativeElement);

    if (!videos.length) return;

    this.videoObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.paused && video.play().catch(() => {});
          } else {
            !video.paused && video.pause();
          }
        });
      },
      { rootMargin: '200px 0px 200px 0px', threshold: 0 }
    );

    videos.forEach(video => this.videoObserver!.observe(video));
  }

  // ─── HERO — ANIMACIÓN DEL LOGO ───────────────────────────────────────────────

  private animateHero(): void {
    const svg = this.logoSvg?.nativeElement;
    if (!svg) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];

    // Ordenar paths de izquierda a derecha según su posición en el SVG
    const sorted = [...paths].sort((a, b) => {
      const ax = a.getBBox?.()?.x ?? 0;
      const bx = b.getBBox?.()?.x ?? 0;
      return ax - bx;
    });

    // Revelar el SVG y preparar el efecto de escritura
    gsap.set(svg, { opacity: 1, y: 20 });

    sorted.forEach(path => {
      const len = path.getTotalLength?.() ?? 0;
      gsap.set(path, {
        fill:            'none',
        stroke:          '#fef5ec',
        strokeWidth:     0.9,
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity:         1
      });
    });

    // Deslizar el SVG hacia su posición final
    tl.to(svg, { y: 0, duration: 3.2, ease: 'expo.out' }, 0);

    // Dibujar cada path en secuencia (efecto escritura a mano)
    const writeDuration = 0.9;
    const staggerGap   = 0.055;
    const writeStart   = 0.4;

    sorted.forEach((path, i) => {
      tl.to(
        path,
        { strokeDashoffset: 0, duration: writeDuration, ease: 'power2.inOut' },
        writeStart + i * staggerGap
      );
    });

    const writeEnd = writeStart + (sorted.length - 1) * staggerGap + writeDuration;

    // Rellenar cada path en cuanto su trazo esté al 60%
    sorted.forEach((path, i) => {
      const fillStart = writeStart + i * staggerGap + writeDuration * 0.6;
      tl.to(
        path,
        { fill: '#fef5ec', strokeWidth: 0, strokeOpacity: 0, duration: 0.5, ease: 'power2.inOut' },
        fillStart
      );
    });

    // Tagline aparece al terminar el logo
    if (this.heroTagline?.nativeElement) {
      tl.fromTo(
        this.heroTagline.nativeElement,
        { opacity: 0, y: 10, letterSpacing: '0.6em' },
        { opacity: 1, y: 0, letterSpacing: '0.35em', duration: 1.4, ease: 'power3.out' },
        writeEnd + 0.15
      );
    }
  }
  // ─── PANELES INFERIORES ───────────────────────────────────────────────────────
  private animateBottomPanels(): void {
    // Zoom-out + encendido de brillo en las imágenes
    const imageProps = {
      scale:    1,
      filter:   'brightness(0.82) contrast(0.80) saturate(1.7)',
      duration: 1.5,
      ease:     'expo.out',
      delay:    0.06
    };

    if (this.leftImage?.nativeElement)  gsap.to(this.leftImage.nativeElement,  imageProps);
    if (this.rightImage?.nativeElement) gsap.to(this.rightImage.nativeElement, imageProps);

    // Contenido de texto: fade-in desde abajo
    const contentProps = {
      opacity:  1,
      y:        0,
      duration: 1.4,
      ease:     'expo.out',
      delay:    0.5
    };

    if (this.leftContent?.nativeElement)  gsap.to(this.leftContent.nativeElement,  contentProps);
    if (this.rightContent?.nativeElement) gsap.to(this.rightContent.nativeElement, contentProps);

    // Divisores: scale-in desde el centro
    const dividers = document.querySelectorAll('.h-px.w-40');
    gsap.set(dividers, { scaleX: 0, transformOrigin: 'center' });
    gsap.to(dividers, {
      scaleX:   1,
      duration: 1.2,
      ease:     'expo.out',
      delay:    0.5,
      stagger:  0.15
    });
  }
}