import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, Renderer2, Inject, PLATFORM_ID, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  animations: [
    trigger('backdropAnim', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }))
      ])
    ])
  ]
})
export class ModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Input() Mostyles: string = 'p-0';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.appendChild(document.body, this.el.nativeElement);
    }
  }

  ngOnChanges(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.open ? this.lockScroll() : this.unlockScroll();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.unlockScroll();
      if (this.el.nativeElement.parentNode) {
        this.renderer.removeChild(this.el.nativeElement.parentNode, this.el.nativeElement);
      }
    }
  }

  private lockScroll(): void {
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
  }

  private unlockScroll(): void {
    this.renderer.removeStyle(document.body, 'overflow');
  }

  close() {
    this.open = false;
    this.openChange.emit(false);
  }
}