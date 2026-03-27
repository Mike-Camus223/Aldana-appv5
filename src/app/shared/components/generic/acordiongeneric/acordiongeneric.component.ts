import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';

@Component({
  selector: 'app-acordiongeneric',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acordiongeneric.component.html',
  styleUrls: ['./acordiongeneric.component.css'],
})
export class AcordiongenericComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title = '';
  @Input() value = '';
  @Input() selected: string | null = null;
  @Input() selectedMultiple: string[] = [];
  @Input() disableTransition: boolean = false;
  @Output() toggled = new EventEmitter<string>();
  @ViewChild('contentWrapper') contentWrapper!: ElementRef<HTMLDivElement>;
  @Input() icon: string | null = null;     
  @Input() useIcon: boolean = false;
  @Input() classTitle: string | null = null;
  @Input() iconImg: string | null = null;
  @Input() iconImgStyle: string | null = null;

  contentHeight = 0;
  private mutationObserver: MutationObserver | null = null;
  private changeDetectorRef = inject(ChangeDetectorRef);

  onToggle(): void {
    this.toggled.emit(this.value);
  }

  isOpen(): boolean {
    const single = this.selected === this.value;
    const multi = Array.isArray(this.selectedMultiple) && this.selectedMultiple.includes(this.value);
    return single || multi;
  }

  ngAfterViewInit() {
    this.updateContentHeight();
    this.setupMutationObserver();
    this.changeDetectorRef.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('selected' in changes || 'selectedMultiple' in changes) {
      this.updateContentHeight();
    }
  }

  private updateContentHeight() {
    if (!this.contentWrapper) return;

    const newHeight = this.isOpen() ? this.contentWrapper.nativeElement.scrollHeight : 0;
    if (this.contentHeight !== newHeight) {
      this.contentHeight = newHeight;
      this.changeDetectorRef.detectChanges();
    }
  }

  private setupMutationObserver() {
    if (!this.contentWrapper) return;
    // Observa cambios dentro del contenido para recalcular altura en tiempo real
    this.mutationObserver = new MutationObserver(() => {
      this.updateContentHeight();
    });
    this.mutationObserver.observe(this.contentWrapper.nativeElement, {
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }
}
