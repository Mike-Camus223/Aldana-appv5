import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import gsap from 'gsap';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-cursor.component.html',
  styleUrls: ['./custom-cursor.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CustomCursorComponent implements OnInit, OnDestroy {
  @ViewChild('cursorContainer') cursorContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('cursorDot') cursorDot!: ElementRef<HTMLDivElement>;
  @ViewChild('cursorRing') cursorRing!: ElementRef<HTMLDivElement>;

  isHovered = false;
  isHidden = true;

  private isBrowser: boolean;
  private mouseX = 0;
  private mouseY = 0;
  private targetX = 0;
  private targetY = 0;
  
  private mouseMoveHandler = (e: MouseEvent) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    
    if (this.isHidden) {
      this.isHidden = false;
      if (this.cursorContainer) {
        this.cursorContainer.nativeElement.classList.remove('hidden-cursor');
      }
      if (this.cursorDot && this.cursorRing) {
        gsap.set(this.cursorDot.nativeElement, { x: this.mouseX, y: this.mouseY });
        gsap.set(this.cursorRing.nativeElement, { x: this.mouseX, y: this.mouseY });
        this.targetX = this.mouseX;
        this.targetY = this.mouseY;
      }
    }
    
    if (this.cursorDot) {
      gsap.set(this.cursorDot.nativeElement, { x: this.mouseX, y: this.mouseY });
    }
  };

  private hideCursor = () => {
    this.isHidden = true;
    if (this.cursorContainer) {
      this.cursorContainer.nativeElement.classList.add('hidden-cursor');
    }
  };

  private showCursor = () => {
    this.isHidden = false;
    if (this.cursorContainer) {
      this.cursorContainer.nativeElement.classList.remove('hidden-cursor');
    }
  };

  private mouseOverHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    const clickable = target.closest('a, button, [role="button"], select, input, textarea, .cursor-pointer');
    if (clickable) {
      this.isHovered = true;
      if (this.cursorContainer) {
        this.cursorContainer.nativeElement.classList.add('hovered');
      }
    }
  };

  private mouseOutHandler = (e: MouseEvent) => {
    if (!e.relatedTarget) {
      this.hideCursor();
      return;
    }

    const target = e.target as HTMLElement;
    if (!target) return;

    const clickable = target.closest('a, button, [role="button"], select, input, textarea, .cursor-pointer');
    if (clickable) {
      const relatedTarget = e.relatedTarget as HTMLElement;
      if (!relatedTarget || !relatedTarget.closest('a, button, [role="button"], select, input, textarea, .cursor-pointer')) {
        this.isHovered = false;
        if (this.cursorContainer) {
          this.cursorContainer.nativeElement.classList.remove('hovered');
        }
      }
    }
  };

  private onTick = () => {
    if (this.isHidden) return;

    this.targetX += (this.mouseX - this.targetX) * 0.15;
    this.targetY += (this.mouseY - this.targetY) * 0.15;

    if (this.cursorRing) {
      gsap.set(this.cursorRing.nativeElement, {
        x: this.targetX,
        y: this.targetY
      });
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = window.innerWidth < 1024;
    
    if (isTouchDevice || isMobile) {
      return;
    }

    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
    document.addEventListener('mouseleave', this.hideCursor);
    document.addEventListener('mouseenter', this.showCursor);
    document.addEventListener('mouseover', this.mouseOverHandler);
    document.addEventListener('mouseout', this.mouseOutHandler);
    window.addEventListener('blur', this.hideCursor);

    gsap.ticker.add(this.onTick);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    window.removeEventListener('mousemove', this.mouseMoveHandler);
    document.removeEventListener('mouseleave', this.hideCursor);
    document.removeEventListener('mouseenter', this.showCursor);
    document.removeEventListener('mouseover', this.mouseOverHandler);
    document.removeEventListener('mouseout', this.mouseOutHandler);
    window.removeEventListener('blur', this.hideCursor);

    gsap.ticker.remove(this.onTick);
  }
}
