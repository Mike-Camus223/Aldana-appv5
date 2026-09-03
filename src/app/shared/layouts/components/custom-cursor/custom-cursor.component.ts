import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
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
  isClicked = false;
  isHidden = true;

  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean = isPlatformBrowser(this.platformId);
  private mouseX = -100;
  private mouseY = -100;
  private ringX = -100;
  private ringY = -100;
  private isEnabled = false;

  private setDotX?: any;
  private setDotY?: any;
  private setRingX?: any;
  private setRingY?: any;

  private mouseMoveHandler = (e: MouseEvent) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    if (this.isHidden) {
      this.isHidden = false;
      this.ringX = this.mouseX;
      this.ringY = this.mouseY;
      if (this.cursorContainer) {
        this.cursorContainer.nativeElement.classList.remove('hidden-cursor');
      }
    }

    if (this.setDotX && this.setDotY) {
      this.setDotX(this.mouseX);
      this.setDotY(this.mouseY);
    }
  };

  private createWaterRipple(x: number, y: number) {
    if (!this.isBrowser) return;
    const ripple = document.createElement('div');
    ripple.className = 'custom-cursor-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove();
      }
    }, 1000);
  }

  private mouseDownHandler = (e: MouseEvent) => {
    this.isClicked = true;
    if (this.cursorContainer) {
      this.cursorContainer.nativeElement.classList.add('clicked');
    }
    const x = e.clientX || this.mouseX;
    const y = e.clientY || this.mouseY;
    if (x >= 0 && y >= 0) {
      this.createWaterRipple(x, y);
    }
  };

  private mouseUpHandler = () => {
    this.isClicked = false;
    if (this.cursorContainer) {
      this.cursorContainer.nativeElement.classList.remove('clicked');
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

    const isText = target.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]');
    if (isText) {
      if (this.cursorContainer) {
        this.cursorContainer.nativeElement.classList.add('on-input');
      }
    } else {
      if (this.cursorContainer) {
        this.cursorContainer.nativeElement.classList.remove('on-input');
      }
    }

    const clickable = target.closest('a, button, [role="button"], select, input[type="submit"], input[type="button"], label, .cursor-pointer, [data-cursor]');
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

    const relatedTarget = e.relatedTarget as HTMLElement;

    if (this.cursorContainer && (!relatedTarget || !relatedTarget.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]'))) {
      this.cursorContainer.nativeElement.classList.remove('on-input');
    }

    const clickable = target.closest('a, button, [role="button"], select, input[type="submit"], input[type="button"], label, .cursor-pointer, [data-cursor]');
    if (clickable) {
      if (!relatedTarget || !relatedTarget.closest('a, button, [role="button"], select, input[type="submit"], input[type="button"], label, .cursor-pointer, [data-cursor]')) {
        this.isHovered = false;
        if (this.cursorContainer) {
          this.cursorContainer.nativeElement.classList.remove('hovered');
        }
      }
    }
  };

  private focusInHandler = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (this.cursorContainer) {
      this.cursorContainer.nativeElement.classList.add('focused');
    }
    if (target && target.matches('input, textarea, [contenteditable="true"]')) {
      if (this.cursorContainer) {
        this.cursorContainer.nativeElement.classList.add('on-input');
      }
    }
  };

  private focusOutHandler = () => {
    if (this.cursorContainer) {
      this.cursorContainer.nativeElement.classList.remove('focused');
      this.cursorContainer.nativeElement.classList.remove('on-input');
    }
  };

  private onTick = () => {
    if (this.isHidden || !this.isEnabled) return;

    // Smooth Lerp damping for Benito Fernandez / luxury fluid trailing feel
    const lerpFactor = 0.18;
    this.ringX += (this.mouseX - this.ringX) * lerpFactor;
    this.ringY += (this.mouseY - this.ringY) * lerpFactor;

    if (this.setRingX && this.setRingY) {
      this.setRingX(this.ringX);
      this.setRingY(this.ringY);
    }
  };

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobile = window.innerWidth < 1024;

    if (isTouchDevice || isMobile) {
      return;
    }

    this.isEnabled = true;

    setTimeout(() => {
      if (this.cursorDot && this.cursorRing) {
        gsap.set([this.cursorDot.nativeElement, this.cursorRing.nativeElement], {
          xPercent: -50,
          yPercent: -50
        });
        this.setDotX = gsap.quickSetter(this.cursorDot.nativeElement, 'x', 'px');
        this.setDotY = gsap.quickSetter(this.cursorDot.nativeElement, 'y', 'px');
        this.setRingX = gsap.quickSetter(this.cursorRing.nativeElement, 'x', 'px');
        this.setRingY = gsap.quickSetter(this.cursorRing.nativeElement, 'y', 'px');
      }
    }, 50);

    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
    window.addEventListener('mousedown', this.mouseDownHandler, { passive: true });
    window.addEventListener('mouseup', this.mouseUpHandler, { passive: true });
    document.addEventListener('mouseleave', this.hideCursor);
    document.addEventListener('mouseenter', this.showCursor);
    document.addEventListener('mouseover', this.mouseOverHandler);
    document.addEventListener('mouseout', this.mouseOutHandler);
    document.addEventListener('focusin', this.focusInHandler);
    document.addEventListener('focusout', this.focusOutHandler);
    window.addEventListener('blur', this.hideCursor);

    gsap.ticker.add(this.onTick);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser || !this.isEnabled) return;

    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('mousedown', this.mouseDownHandler);
    window.removeEventListener('mouseup', this.mouseUpHandler);
    document.removeEventListener('mouseleave', this.hideCursor);
    document.removeEventListener('mouseenter', this.showCursor);
    document.removeEventListener('mouseover', this.mouseOverHandler);
    document.removeEventListener('mouseout', this.mouseOutHandler);
    document.removeEventListener('focusin', this.focusInHandler);
    document.removeEventListener('focusout', this.focusOutHandler);
    window.removeEventListener('blur', this.hideCursor);

    gsap.ticker.remove(this.onTick);
  }
}
