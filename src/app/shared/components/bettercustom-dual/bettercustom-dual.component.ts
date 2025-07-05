import { Component, Input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bettercustom-dual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bettercustom-dual.component.html',
})
export class BettercustomDualComponent {
  @Input() imageUrl = '';
  @Input() CommentsTestimonial = false;
  @Input() title = '';
  @Input() subtitles: string[] = [];
  @Input() contentTestimonial = '';
  @Input() content = '';
  @Input() extraContent = '';

  @Input() imageWidth = '60%';
  @Input() textWidth = '40%';

  @Input() textContainerClass = '';

  @Input() mobileOrder: 'image-first' | 'text-first' = 'image-first';
  @Input() desktopOrder: 'image-first' | 'text-first' = 'image-first';

  @Input() height: string = '420px';
  @Input() mobileHeight: string = '';

  screenWidth = window.innerWidth;

  @HostListener('window:resize')
  onResize() {
    this.screenWidth = window.innerWidth;
  }

  getImageStyle() {
    return this.screenWidth >= 768 ? { width: this.imageWidth } : {};
  }

  getTextStyle() {
    return this.screenWidth >= 768 ? { width: this.textWidth } : {};
  }

  getBlockHeight() {
    const isDesktop = this.screenWidth >= 768;
    if (isDesktop) {
      return { height: this.height };
    } else if (this.mobileHeight) {
      return { height: this.mobileHeight };
    } else {
      return {};
    }
  }

  getCombinedStyle(base: { [key: string]: any }) {
    return {
      ...base,
      ...this.getBlockHeight(),
    };
  }

  getImageOrderClasses() {
    const mobile = this.mobileOrder === 'image-first' ? 'order-1' : 'order-2';
    const desktop = this.desktopOrder === 'image-first' ? 'md:order-1' : 'md:order-2';
    return `${mobile} ${desktop}`;
  }

  getTextOrderClasses() {
    const mobile = this.mobileOrder === 'text-first' ? 'order-1' : 'order-2';
    const desktop = this.desktopOrder === 'text-first' ? 'md:order-1' : 'md:order-2';
    return `${mobile} ${desktop}`;
  }
}
