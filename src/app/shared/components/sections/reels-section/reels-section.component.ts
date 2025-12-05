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

  fakeComments = [
    { user: 'usuario1', text: '¡Excelente contenido! ❤️', time: 'Hace 2 horas' },
    { user: 'usuario2', text: 'Muy buen contenido 🔥✨', time: 'Hace 1 hora' },
    { user: 'usuario3', text: 'Increíble diseño 😍', time: 'Hace 30 min' },
    { user: 'usuario4', text: 'Me encanta esto 🎉', time: 'Hace 15 min' },
    { user: 'usuario5', text: '¡Sigue así! 💪', time: 'Hace 10 min' },
    { user: 'usuario6', text: 'Wow, increíble trabajo', time: 'Hace 5 min' },
    { user: 'usuario7', text: 'Esto es arte 🎨', time: 'Hace 3 min' },
  ];

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
    const { data } = await this.supabaseService.getTempReels();
    this.reels = data || [];

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