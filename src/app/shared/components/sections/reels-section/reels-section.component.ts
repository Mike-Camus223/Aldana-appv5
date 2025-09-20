import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { ModalComponent } from '../../generic/modal/modal.component';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { CarouselImagesGenericv2Component } from '../../generic/carousel-images-genericv2/carousel-images-genericv2.component';

@Component({
  selector: 'app-reels-section',
  standalone: true,
  imports: [CommonModule, ModalComponent, CarouselImagesGenericv2Component],
  templateUrl: './reels-section.component.html',
  styleUrls: ['./reels-section.component.css']
})
export class ReelsSectionComponent implements OnInit {
  showModal = false;
  reels: any[] = [];
  selectedReel: any = null;
  isMobile = false;

  slidesPerView = 2;
  spacing = 5;

  breakpoints: any = {
    '(min-width: 640px)': { slides: { perView: 2, spacing: 5 } },
    '(min-width: 768px)': { slides: { perView: 3, spacing: 5 } },
    '(min-width: 1024px)': { slides: { perView: 4, spacing: 5 } },
    '(min-width: 1280px)': { slides: { perView: 5, spacing: 5 } }
  };

  constructor(
    private supabaseService: SupabaseService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async ngOnInit(): Promise<void> {
    const { data } = await this.supabaseService.getTempReels();
    this.reels = data || [];
    
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 1024;
    } else {
      // Valor predeterminado para SSR
      this.isMobile = false;
    }
  }

openModal(reel: any): void {
  if (!reel) return;
  this.selectedReel = reel;
  this.showModal = true;
}
}
