import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  HostListener,
} from '@angular/core';
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
export class ReelsSectionComponent implements OnInit, OnDestroy {
  showModal = false;
  reels: any[] = [];
  selectedReel: any = null;
  isMobile = false;
  isMediaLoading = true;
  modalStyles = '';
  slidesPerView = 2;
  spacing = 5;

  // Carousel del modal
  currentMediaIndex = 0;
  isMuted = true;

  // Para mantener la posición del scroll
  private scrollPosition = 0;

  breakpoints: any = {
    '(min-width: 640px)': { slides: { perView: 2, spacing: 5 } },
    '(min-width: 768px)': { slides: { perView: 3, spacing: 5 } },
    '(min-width: 1024px)': { slides: { perView: 4, spacing: 5 } },
    '(min-width: 1280px)': { slides: { perView: 5, spacing: 5 } },
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
    await this.loadInstagramReels();

    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 1024;
      this.updateModalStyles();
    }
  }

  ngOnDestroy(): void {
    // Asegurarse de desbloquear el scroll al destruir el componente
    this.unlockScroll();
  }

  onMediaLoaded(_event?: Event): void {
    this.isMediaLoading = false;
  }

  private async loadInstagramReels(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getInstagramReels();

      if (error) {
        this.reels = [];
        return;
      }

      if (!data || data.length === 0) {
        this.reels = [];
        return;
      }

      // Mapear los datos EXACTAMENTE como vienen de la API
      this.reels = data.map((item: any) => {
        return {
          id: item.id,
          image_url: item.image_url || item.thumbnail_url,
          caption: item.caption || '',
          hashtags: item.hashtags || '',
          post_url: item.post_url || item.permalink,
          media_type: item.media_type,
          media_url: item.media_url,
          like_count: item.like_count || 0,
          comments_count: item.comments_count || 0,
          timestamp: item.timestamp,
          // IMPORTANTE: Asegurarnos de que comments sea un array válido
          comments: Array.isArray(item.comments) ? item.comments : [],
          media: item.media || [
            {
              url: item.media_url,
              type:
                item.media_type === 'VIDEO' || item.media_type === 'REELS'
                  ? 'video'
                  : 'image',
            },
          ],
          profile_picture_url: item.profile_picture_url || '',
          username: item.username || 'aldyapp',
        };
      });
    } catch (error) {
      this.reels = [];
    }
  }

  updateModalStyles(): void {
    if (this.isMobile) {
      this.modalStyles =
        'fixed inset-0 w-screen h-screen m-0 p-0 bg-white rounded-none overflow-hidden z-[9999]';
    } else {
      this.modalStyles = 'w-auto max-h-[90vh] rounded-sm';
    }
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return 'Fecha desconocida';

    // Si el timestamp ya viene formateado de la función Edge
    if (timestamp.includes('Hace')) {
      return timestamp;
    }

    // Si es un timestamp ISO, formatearlo
    try {
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
    } catch (e) {
      return 'Fecha desconocida';
    }
  }

  private lockScroll(): void {
    // SOLO bloquear scroll en mobile
    if (isPlatformBrowser(this.platformId) && this.isMobile) {
      // Guardar la posición actual del scroll
      this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = '100%';
      
      // Para iOS Safari - prevenir scroll touch
      document.body.style.touchAction = 'none';
      
      // Agregar clase adicional por si acaso
      document.body.classList.add('no-scroll');
    }
  }

  private unlockScroll(): void {
    // SOLO desbloquear si estaba bloqueado (mobile)
    if (isPlatformBrowser(this.platformId) && this.isMobile) {
      // Restaurar scroll del body
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      
      // Remover clase
      document.body.classList.remove('no-scroll');
      
      // Restaurar la posición del scroll
      window.scrollTo(0, this.scrollPosition);
    }
  }

  openModal(reel: any): void {
    if (!reel) return;
    this.selectedReel = reel;
    this.currentMediaIndex = 0;
    this.isMuted = true;
    this.isMediaLoading = true;
    this.showModal = true;
    this.lockScroll();
  }

  closeModal(): void {
    this.showModal = false;
    this.unlockScroll();
    // Delay clearing the selectedReel to prevent flashing empty state during animation
    setTimeout(() => {
      this.currentMediaIndex = 0;
      this.selectedReel = null;
    }, 200); // Match the animation duration
  }

  onModalChange(isOpen: boolean): void {
    this.showModal = isOpen;
    if (!isOpen) {
      this.unlockScroll();
      // Delay clearing the selectedReel to prevent flashing empty state during animation
      setTimeout(() => {
        this.currentMediaIndex = 0;
        this.selectedReel = null;
      }, 200); // Match the animation duration
    }
  }

  /**
   * Genera iniciales a partir de un nombre de usuario
   */
  getInitials(username: string): string {
    if (!username) return '?';

    // Remover @ si existe
    const cleanName = username.replace('@', '').trim();

    // Si es un solo nombre/palabra
    if (!cleanName.includes(' ') && !cleanName.includes('_')) {
      return cleanName.substring(0, 2).toUpperCase();
    }

    // Si tiene espacios
    if (cleanName.includes(' ')) {
      const words = cleanName.split(/\s+/);
      if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
      }
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    // Si tiene guión bajo (formato username)
    if (cleanName.includes('_')) {
      const parts = cleanName.split('_');
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return cleanName.substring(0, 2).toUpperCase();
  }

  /**
   * Genera un color consistente basado en el nombre de usuario
   * Usa una paleta de colores agradables
   */
  getAvatarColor(username: string): string {
    const colors = [
      '#FF6B6B', // Rojo coral
      '#4ECDC4', // Turquesa
      '#45B7D1', // Azul cielo
      '#FFA07A', // Salmón
      '#98D8C8', // Menta
      '#F7DC6F', // Amarillo suave
      '#BB8FCE', // Lavanda
      '#85C1E2', // Azul claro
      '#F8B4D9', // Rosa
      '#AED581', // Verde lima
      '#FFB74D', // Naranja
      '#9575CD', // Púrpura
    ];

    // Generar un índice consistente basado en el username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  /**
   * Alternativa: Generar colores de gradiente
   */
  getAvatarGradient(username: string): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
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
    if (
      this.selectedReel?.media &&
      this.currentMediaIndex < this.selectedReel.media.length - 1
    ) {
      this.currentMediaIndex++;
      this.isMediaLoading = true;
      this.resetVideoState();
    }
  }

  prevMedia(): void {
    if (this.currentMediaIndex > 0) {
      this.currentMediaIndex--;
      this.isMediaLoading = true;
      this.resetVideoState();
    }
  }

  goToMedia(index: number): void {
    this.currentMediaIndex = index;
    this.isMediaLoading = true;
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

  get hasComments(): boolean {
    return this.selectedReel?.comments && this.selectedReel.comments.length > 0;
  }
}