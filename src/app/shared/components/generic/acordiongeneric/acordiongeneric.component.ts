import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-acordiongeneric',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './acordiongeneric.component.html',
  styleUrls: ['./acordiongeneric.component.css'],
})
export class AcordiongenericComponent implements AfterViewInit, OnChanges {
  @Input() title = '';
  @Input() value = '';
  @Input() selected: string | null = null;
  @Input() selectedMultiple: string[] = [];
  @Output() toggled = new EventEmitter<string>();

  @ViewChild('contentWrapper') contentWrapper!: ElementRef<HTMLDivElement>;

  contentHeight = 0;

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
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('selected' in changes || 'selectedMultiple' in changes) {
      this.updateContentHeight();
    }
  }

  private updateContentHeight() {
    if (!this.contentWrapper) return;

    if (this.isOpen()) {
      // Medir altura real del contenido para la transición
      this.contentHeight = this.contentWrapper.nativeElement.scrollHeight;
    } else {
      // Si está cerrado, maxHeight = 0
      this.contentHeight = 0;
    }
  }
}
