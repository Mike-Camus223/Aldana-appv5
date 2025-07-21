import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-loading-screen-generic',
  standalone: true,
  templateUrl: './loading-screen-generic.component.html',
  styleUrl: './loading-screen-generic.component.css'
})
export class LoadingScreenGenericComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('loadingScreen') loadingScreenRef!: ElementRef;
  @ViewChild('logo') logoRef!: ElementRef;

  private timeline!: gsap.core.Timeline;

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    const screen = this.loadingScreenRef.nativeElement;
    const logo = this.logoRef.nativeElement;

    this.timeline = gsap.timeline({
      onComplete: () => {
        screen.style.display = 'none';
      }
    });

    this.timeline
      .to(screen, { duration: 0.3, opacity: 1, ease: 'power2.out' })
      .to(logo, { duration: 0.35, opacity: 1, y: 0, ease: 'power2.out' }, '-=0.15')
      .to({}, { duration: 0.3 })
      .to(logo, { duration: 0.25, opacity: 0, y: 20, ease: 'power2.in' })
      .add(() => {
        document.body.style.overflow = ''; 
      })
      .to(screen, { duration: 0.4, opacity: 0, ease: 'power2.in' });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    if (this.timeline) {
      this.timeline.kill();
    }
  }
}
