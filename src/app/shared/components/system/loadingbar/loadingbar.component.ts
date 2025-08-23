import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loadingbar',
  templateUrl: './loadingbar.component.html',
  imports: [CommonModule],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoadingbarComponent implements OnChanges {
  @Input() loading = false;
  progress = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['loading']) {
      if (this.loading) {
        this.startProgress();
      } else {
        this.progress = 0;
      }
    }
  }

  private startProgress(): void {
    this.progress = 0;
    const interval = setInterval(() => {
      if (this.progress < 100) {
        this.progress += 2;
      } else {
        clearInterval(interval);
      }
    }, 10);
  }
}
