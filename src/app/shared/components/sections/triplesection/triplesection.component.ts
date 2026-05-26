import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy
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
  imports: [LucideAngularModule,RouterModule],
  templateUrl: './triplesection.component.html',
  styleUrl: './triplesection.component.css',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ArrowLeft, ArrowRight })
    }
  ]
})
export class TriplesectionComponent implements AfterViewInit, OnDestroy {

  @ViewChild('heroImage') heroImage!: ElementRef;
  @ViewChild('leftImage') leftImage!: ElementRef;
  @ViewChild('rightImage') rightImage!: ElementRef;
  @ViewChild('logoSvg') logoSvg!: ElementRef;
  @ViewChild('heroTagline') heroTagline!: ElementRef;
  @ViewChild('leftArrowBtn') leftArrowBtn!: ElementRef;
  @ViewChild('rightArrowBtn') rightArrowBtn!: ElementRef;

  private animationSubscription?: Subscription;
  private hasAnimated = false;

  constructor(private loaderService: LoaderService) { }

  ngAfterViewInit(): void {
    this.animationSubscription =
      this.loaderService.animationsEnabled$
        .subscribe(enabled => {
          if (!enabled) return;
          if (this.hasAnimated) return;
          this.hasAnimated = true;

          this.animateHero();
          this.animateBottomPanels();
          this.setupArrowHover(this.leftArrowBtn.nativeElement);
          this.setupArrowHover(this.rightArrowBtn.nativeElement);
        });
  }

  ngOnDestroy(): void {
    this.animationSubscription?.unsubscribe();
  }

  // ─── HERO ────────────────────────────────────────────────────────────────────

  private animateHero(): void {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const heroSection = (this.heroImage.nativeElement as HTMLElement).closest('section');
    heroSection?.querySelectorAll('video').forEach((v: HTMLVideoElement) => {
      v.muted = true;
      v.loop = true;
      v.play().catch(() => { });
    });

    // ── Video: solo oscurecer/aclarar el overlay, nunca tocar el video en sí ──
    // El video corre solo con autoplay. Animamos el filtro del overlay,
    // no el elemento <video>, para no interferir con la reproducción.
    const heroWrapper = (this.heroImage.nativeElement as HTMLElement).parentElement;
    if (heroWrapper) {
      // Overlay extra que arranca opaco y se abre como un iris cinematográfico
      const overlay = heroWrapper.querySelector('.bg-black\\/22') as HTMLElement;
      if (overlay) {
        gsap.fromTo(overlay,
          { opacity: 1 },
          { opacity: 1, duration: 0 } // lo dejamos en su estado natural, 
          // la animación de entrada la hacemos con el contenido sobre él
        );
      }
    }

    // ── SVG logo: escritura a mano real ──────────────────────────────────────
    const svg = this.logoSvg.nativeElement as SVGSVGElement;
    const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];

    // Hacer visible el SVG desde el inicio (antes invisible con opacity:0 en HTML)
    gsap.set(svg, { opacity: 1, y: 20 });

    // Ordenar de izquierda a derecha (como una pluma escribiendo)
    const sorted = paths.slice().sort((a, b) => {
      const ax = a.getBBox?.()?.x ?? 0;
      const bx = b.getBBox?.()?.x ?? 0;
      return ax - bx;
    });

    // Preparar cada path para el efecto "escritura":
    // strokeDasharray = largo total del path, strokeDashoffset arranca en ese valor
    // y anima hasta 0 → el trazo "se dibuja" de punta a punta
    sorted.forEach(path => {
      const len = path.getTotalLength();
      gsap.set(path, {
        fill: 'none',
        stroke: '#fef5ec',
        strokeWidth: 0.9,
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity: 1
      });
    });

    // Float del SVG completo
    tl.to(svg, { y: 0, duration: 3.2, ease: 'expo.out' }, 0);

    // Dibujar path por path de izq → der, como una pluma corriendo
    // Cada path empieza a dibujarse apenas el anterior va por la mitad → sensación continua
    const writeDuration = 0.9;   // duración de dibujo por trazo
    const staggerGap = 0.055; // solapamiento entre trazos consecutivos
    const writeStart = 0.4;   // cuándo empieza el primer trazo

    sorted.forEach((path, i) => {
      const len = path.getTotalLength();
      tl.to(path,
        {
          strokeDashoffset: 0,
          duration: writeDuration,
          ease: 'power2.inOut'
        },
        writeStart + i * staggerGap
      );
    });

    // Fin de la escritura → calcular cuándo termina el último trazo
    const writeEnd = writeStart + (sorted.length - 1) * staggerGap + writeDuration;

    // Crossfade: fill aparece suavemente, stroke desaparece
    // Se hace trazo por trazo para que parezca que la tinta "se seca" de izquierda a derecha
    sorted.forEach((path, i) => {
      const fillStart = writeStart + i * staggerGap + writeDuration * 0.6;
      tl.to(path,
        {
          fill: '#fef5ec',
          strokeWidth: 0,
          strokeOpacity: 0,
          duration: 0.5,
          ease: 'power2.inOut'
        },
        fillStart
      );
    });

    // Tagline — aparece justo cuando el logo termina de "secarse"
    tl.fromTo(
      this.heroTagline.nativeElement,
      { opacity: 0, y: 10, letterSpacing: '0.6em' },
      { opacity: 1, y: 0, letterSpacing: '0.35em', duration: 1.4, ease: 'power3.out' },
      writeEnd + 0.15
    );
  }

  // ─── BOTTOM PANELS ───────────────────────────────────────────────────────────

  private animateBottomPanels(): void {

    // Las imágenes: animamos brightness de oscuro a menos oscuro
    // (scale ya está en el HTML como valor inicial 1.18, lo llevamos a 1.02)
    gsap.to(this.leftImage.nativeElement, {
      scale: 1,
      filter: 'brightness(0.82) contrast(0.80) saturate(1.7)',
      duration: 1.5, ease: 'expo.out',delay: 0.06
    });

    gsap.to(this.rightImage.nativeElement, {
      scale: 1,
      filter: 'brightness(0.82) contrast(0.80) saturate(1.7)',
      duration: 1.5, ease: 'expo.out',delay: 0.06
    });

    // Contenido de los paneles (texto + botón)
    const leftPanel = this.leftArrowBtn.nativeElement.closest('.relative.overflow-hidden');
    const rightPanel = this.rightArrowBtn.nativeElement.closest('.relative.overflow-hidden');
    const leftContent = leftPanel?.querySelector('.relative.z-10 .flex-col');
    const rightContent = rightPanel?.querySelector('.relative.z-10 .flex-col');

    if (leftContent) {
      gsap.to(leftContent, {
        opacity: 1, y: 0,
        duration: 1.4, ease: 'expo.out',delay: 0.5
      });
    }

    if (rightContent) {
      gsap.to(rightContent, {
        opacity: 1, y: 0,
        duration: 1.4, ease: 'expo.out', delay: 0.5
      });
    }

    // Divisores horizontales — se expanden desde el centro
    const dividers = document.querySelectorAll('.h-px.w-40');
    gsap.set(dividers, { scaleX: 0, transformOrigin: 'center' });
    gsap.to(dividers, {
      scaleX: 1, duration: 1.2, ease: 'expo.out',
      delay: 0.5, stagger: 0.15
    });
  }

  // ─── HOVER: ARROW BUTTONS ────────────────────────────────────────────────────

  setupArrowHover(button: HTMLElement): void {
    const icon = button.querySelector('lucide-icon');
    const svgEl = (icon as HTMLElement)?.querySelector('svg');

    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        borderColor: '#ffffff',
        backgroundColor: '#ffffff',
        duration: 0.3, ease: 'power2.out'
      });
      if (svgEl) gsap.to(svgEl, { stroke: '#AEC2A9', duration: 0.25 });
    });

    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        borderColor: 'rgba(248,243,237,0.40)',
        backgroundColor: 'transparent',
        duration: 0.35, ease: 'power2.inOut'
      });
      if (svgEl) gsap.to(svgEl, { stroke: '#ffffff', duration: 0.3 });
    });
  }

  // ─── HOVER: MAIN BUTTON ──────────────────────────────────────────────────────

  setupMainButtonHover(button: HTMLElement): void {
    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        backgroundColor: '#F8F3ED',
        color: '#AEC2A9',
        borderColor: '#F8F3ED',
        letterSpacing: '0.34em',
        duration: 0.4, ease: 'power2.out'
      });
    });

    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        backgroundColor: 'transparent',
        color: '#F8F3ED',
        borderColor: '#fff',
        letterSpacing: '0.28em',
        duration: 0.4, ease: 'power2.inOut'
      });
    });

    button.addEventListener('mousedown', () => {
      gsap.to(button, { scale: 0.96, duration: 0.1, ease: 'power2.in' });
    });

    button.addEventListener('mouseup', () => {
      gsap.to(button, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' });
    });
  }
}