import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule,LucideAngularModule],
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css'],
  providers: [
        {
          provide: LUCIDE_ICONS,
          multi: true,
          useValue: new LucideIconProvider({
            ChevronLeft,
            ChevronRight,
            ChevronsRight,
            ChevronsLeft
          })
        }
      ],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-5px) scaleY(0.95)' }),
        animate('200ms ease-out',
          style({ opacity: 1, transform: 'translateY(0) scaleY(1)' })
        )
      ]),
      transition(':leave', [
        animate('150ms ease-in',
          style({ opacity: 0, transform: 'translateY(-5px) scaleY(0.95)' })
        )
      ])
    ])
  ]
})
export class PaginatorComponent {
  @Input() totalItems = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 20];
  @Input() initialPageSize = 5;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  pageSize = this.initialPageSize;
  currentPage = 1;
  isPageSizeOpen = false;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  togglePageSizeDropdown(): void {
    this.isPageSizeOpen = !this.isPageSizeOpen;
  }

  closePageSizeDropdown(): void {
    this.isPageSizeOpen = false;
  }

  selectPageSize(size: number): void {
    this.pageSize = size;
    this.pageSizeChange.emit(this.pageSize);
    this.currentPage = 1;
    this.isPageSizeOpen = false;
    this.pageChange.emit(this.currentPage);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.pageChange.emit(this.currentPage);
  }
}
