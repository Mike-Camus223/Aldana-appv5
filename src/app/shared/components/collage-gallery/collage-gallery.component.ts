import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-collage-gallery',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './collage-gallery.component.html',
  styleUrl: './collage-gallery.component.css',
})
export class CollageGalleryComponent {

  images = [
    'https://picsum.photos/id/1015/400/500',
    'https://picsum.photos/id/1016/400/500',
    'https://picsum.photos/id/1018/400/500',
    'https://picsum.photos/id/1019/400/500',
    'https://picsum.photos/id/1020/400/500',
    'https://picsum.photos/id/1021/400/500',
    'https://picsum.photos/id/1023/400/500'
  ];

  getGridClass(index: number): string {
    const gridStyles = [
      'col-span-1 row-span-1 sm:border-15 sm:border-yellow-100',
      'col-span-1 row-span-2 sm:border-15 sm:border-fuchsia-100',
      'col-span-1 sm:row-span-3 row-span-2',
      'col-span-1 row-span-2 sm:border-15 sm:border-indigo-100',
      'col-span-1 row-span-2',
      'col-span-1 row-span-1 sm:border-15 sm:border-pink-100',
      'sm:col-span-1 col-span-2 row-span-1 sm:border-15 sm:border-emerald-100'
    ];
    return gridStyles[index] || 'col-span-1 row-span-1';
  }

  getAosAnimation(index: number): string {
    switch (index) {
      case 0:
        return 'fade-right';
      case 1:
        return 'fade-down';
      case 2:
        return 'fade-left';
      case 3:
        return 'fade-right';
      case 4:
        return 'fade-up';
      case 5:
        return 'fade-up';
      default:
        return 'fade-up';
    }
  }
}
