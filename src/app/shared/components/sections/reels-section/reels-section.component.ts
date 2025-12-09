import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Inject, HostListener } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { Modalv2Component } from '../../generic/modalv2/modalv2.component';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { CarouselImagesGenericv2Component } from '../../generic/carousel-images-genericv2/carousel-images-genericv2.component';

@Component({
  selector: 'app-reels-section',
  standalone: true,
  imports: [CommonModule, Modalv2Component, CarouselImagesGenericv2Component],
  templateUrl: './reels-section.component.html',
  styleUrls: ['./reels-section.component.css'],
})
export class ReelsSectionComponent implements OnInit {
  showModal = false;
  reels: any[] = [];
  selectedReel: any = null;
  isMobile = false;

  modalStyles = '';

  slidesPerView = 2;
  spacing = 5;

  // Carousel del modal
  currentMediaIndex = 0;
  isMuted = true;



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

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 1024;
      this.updateModalStyles();
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getInstagramReels();
      
      if (error) {
        console.error('Error obteniendo reels de Instagram:', error);
        this.reels = [];
      } else {
        // Mapear los datos de Instagram al formato esperado
        this.reels = data?.map((reel: any) => ({
          id: reel.id,
          image_url: reel.image_url || reel.thumbnail_url,
          caption: reel.caption || '',
          hashtags: reel.hashtags || '',
          post_url: reel.permalink,
          media_type: reel.media_type,
          media_url: reel.media_url,
          like_count: reel.like_count || 0,
          comments_count: reel.comments_count || 0,
          timestamp: reel.timestamp,
          comments: reel.comments || [],
          media: reel.media || [{ url: reel.media_url, type: reel.media_type === 'VIDEO' ? 'video' : 'image' }]
        })) || [];
      }
    } catch (error) {
      console.error('Error en ngOnInit:', error);
      this.reels = [];
    }

    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 1024;
      this.updateModalStyles();
    }
  }

  updateModalStyles(): void {
    if (this.isMobile) {
      this.modalStyles = 'fixed inset-0 w-screen h-screen m-0 p-0 bg-white rounded-none overflow-hidden z-[9999]';
    } else {
      this.modalStyles = 'max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] rounded-sm';
    }
  }

  formatTimestamp(timestamp: string): string {
    // Si el timestamp ya viene formateado de la función Edge, devolverlo tal cual
    if (timestamp && timestamp.includes('Hace')) {
      return timestamp;
    }
    
    // Si es un timestamp ISO, formatearlo
    if (timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) {
        return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else {
        return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      }
    }
    
    return 'Fecha desconocida';
  }

  private lockScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.add('no-scroll');
    }
  }

  private unlockScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('no-scroll');
    }
  }

  openModal(reel: any): void {
    if (!reel) return;
    this.selectedReel = reel;
    this.currentMediaIndex = 0;
    this.isMuted = true;
    this.showModal = true;
    this.lockScroll();
  }

  closeModal(): void {
    this.showModal = false;
    this.currentMediaIndex = 0;
    this.unlockScroll();
  }

  onModalChange(isOpen: boolean): void {
    this.showModal = isOpen;
    if (!isOpen) {
      this.currentMediaIndex = 0;
      this.unlockScroll();
    }
  }

  // Métodos del carousel
  get currentMedia() {
    if (!this.selectedReel?.media || this.selectedReel.media.length === 0) {
      return { url: this.selectedReel?.image_url, type: 'image' };
    }
    return this.selectedReel.media[this.currentMediaIndex];
  }

  get hasMultipleMedia(): boolean {
    return this.selectedReel?.media && this.selectedReel.media.length > 1;
  }

  nextMedia(): void {
    if (this.selectedReel?.media && this.currentMediaIndex < this.selectedReel.media.length - 1) {
      this.currentMediaIndex++;
      this.resetVideoState();
    }
  }

  prevMedia(): void {
    if (this.currentMediaIndex > 0) {
      this.currentMediaIndex--;
      this.resetVideoState();
    }
  }

  goToMedia(index: number): void {
    this.currentMediaIndex = index;
    this.resetVideoState();
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  private resetVideoState(): void {
    this.isMuted = true;
  }

  isVideo(media: any): boolean {
    return media?.type === 'video';
  }
}