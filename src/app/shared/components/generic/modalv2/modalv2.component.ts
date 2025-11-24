import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-modalv2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modalv2.component.html'
})
export class Modalv2Component implements OnChanges {
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  animate = false;

  ngOnChanges() {
    if (this.open) {
      setTimeout(() => (this.animate = true), 10);
    } else {
      this.animate = false;
    }
  }

  close() {
    this.animate = false;
    setTimeout(() => {
      this.open = false;
      this.openChange.emit(false);
    }, 250);
  }
}
