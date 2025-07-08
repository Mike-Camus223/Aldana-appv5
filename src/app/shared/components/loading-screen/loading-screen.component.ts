import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter, HostListener, Renderer2 } from '@angular/core';
import { gsap } from 'gsap';
import { LoaderService } from '../../../core/services/utils/loader.service';

@Component({
  standalone: true,
  selector: 'app-loading-screen',
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css']
})
export class LoadingScreenComponent implements AfterViewInit {

  @ViewChild('screen') screen!: ElementRef;
  @ViewChild('circleGroup') circleGroup!: ElementRef;
  @ViewChild('box1') box1!: ElementRef;
  @ViewChild('box2') box2!: ElementRef;
  @ViewChild('box3') box3!: ElementRef;
  @ViewChild('box4') box4!: ElementRef;
  @ViewChild('letterA') letterA!: ElementRef;
  @ViewChild('letterV') letterV!: ElementRef;
  @ViewChild('name') name!: ElementRef;

  @Output() loadingFinished = new EventEmitter<void>();

constructor(
    private renderer: Renderer2,
    private loaderService: LoaderService
  ) { }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    event.preventDefault();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    if (keys.includes(event.key)) {
      event.preventDefault();
    }
  }

  ngAfterViewInit(): void {
    this.renderer.addClass(document.body, 'reserve-scrollbar-space');
    this.renderer.addClass(document.body, 'body-scroll-lock');

    const tl = gsap.timeline({
      onComplete: () => {
        this.loaderService.finish();
        this.loadingFinished.emit();
      }
    });

    gsap.set(this.box1.nativeElement, { scale: 1 });
    gsap.set(this.box2.nativeElement, { scale: 1 });
    gsap.set(this.box3.nativeElement, { scale: 1 });
    gsap.set(this.box4.nativeElement, { scale: 1 });

    tl.from(this.box1.nativeElement, { y: '-40vh', scale: 0, duration: 1.5, ease: 'back.out(1.7)' }, 0);
    tl.from(this.box2.nativeElement, { y: '40vh', scale: 0, duration: 1.5, ease: 'back.out(1.7)' }, 0.2);
    tl.from(this.box3.nativeElement, { x: '-40vw', scale: 0, duration: 1.5, ease: 'back.out(1.7)' }, 0.4);
    tl.from(this.box4.nativeElement, { x: '40vw', scale: 0, duration: 1.5, ease: 'back.out(1.7)' }, 0.6);

    gsap.set(this.letterA.nativeElement, { x: -90, opacity: 0 });
    gsap.set(this.letterV.nativeElement, { x: 90, opacity: 0 });

    tl.to(this.letterA.nativeElement, { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '+=0.3');
    tl.to(this.letterV.nativeElement, { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '<');
    tl.fromTo(this.name.nativeElement, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '+=0.3');
    [this.box1, this.box2, this.box3, this.box4].forEach(box => {
      const img = box.nativeElement.querySelector('img');

      gsap.set(img, {
        filter: 'grayscale(100%)',
      });

      tl.to(img, {
        filter: 'grayscale(0%)',
        duration: 1,
        ease: 'power2.out',
      }, '-=0.5');
    });

    tl.addLabel('fadeOutStart');

    tl.call(() => {
      this.renderer.removeClass(document.body, 'body-scroll-lock');
    }, undefined, 'fadeOutStart');

    tl.to(this.circleGroup.nativeElement, { opacity: 0, duration: 0.3, ease: 'power2.out' }, 'fadeOutStart');
    tl.to(this.screen.nativeElement, { backgroundColor: '#000', duration: 1, ease: 'power2.out' }, 'fadeOutStart');
    tl.to(this.name.nativeElement, { color: '#ffffff', duration: 1, ease: 'power2.out' }, 'fadeOutStart');
    tl.to(this.screen.nativeElement, { y: '-100%', duration: 0.5, ease: 'power2.inOut' }, 'fadeOutStart+=1');
  }
}
