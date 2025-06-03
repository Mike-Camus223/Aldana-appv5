import {Component,HostListener,OnDestroy,ChangeDetectionStrategy,ChangeDetectorRef} from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { trigger, transition, style, animate } from '@angular/animations';
import { CarouselSidebarComponent } from '../carousel-sidebar/carousel-sidebar.component';
import { AccordionModule } from 'primeng/accordion';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-navbar-public',
  standalone: true,
  imports: [
    CommonModule,DrawerModule,ButtonModule,OverlayBadgeModule,BadgeModule,CarouselSidebarComponent,AccordionModule,RouterModule],
  templateUrl: './navbar-public.component.html',
  styleUrls: ['navbar-public.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NavbarPublicComponent implements OnDestroy {
  MoverScroll = false;
  visible:boolean = false;
  visible2: boolean = false;
  items: string[] = ['Novias', 'Vestidos', 'Tops', 'Diseños'];
  currentIndex = 0;
  private intervalId?: ReturnType<typeof setInterval>;

  constructor(private cdr: ChangeDetectorRef) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.MoverScroll = window.scrollY > 10;
  }

  toggleDrawer() {
    if (this.visible) {
      this.clearIntervalAndReset();
      this.visible = false;
    } else {
      this.visible = true;
      this.currentIndex = 0;
      this.startInterval();
    }
    this.cdr.markForCheck();
  }

  private startInterval() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.cdr.markForCheck();
      }, 2000);
    }
  }

  private clearIntervalAndReset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.currentIndex = 0;
  }

  ngOnDestroy(): void {
    this.clearIntervalAndReset();
  }
}
