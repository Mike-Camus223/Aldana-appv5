import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-newdropcollection',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './newdropcollection.component.html',
  styleUrls: ['./newdropcollection.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewdropcollectionComponent {
  @Input() collection: any;
  @Input() isMobileView: boolean = false;
  
  @Output() collectionSelected = new EventEmitter<any>();

  onClick(): void {
    this.collectionSelected.emit(this.collection);
  }
}
