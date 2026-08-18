import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ModalComponent } from '../../generic/modal/modal.component';
import { InstagramserviceService } from '../../../../core/services/data-access/instagram/instagramservice.service';
import { AppGenericCarouselComponent, CarouselConfig } from '../../generic/generic-carousel/generic-carousel.component';
import { CarouselItemDirective } from '../../../utils/directives/carousel-slide.directive';
import { Heart, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Sparkle } from 'lucide-angular';


@Component({
  selector: 'app-reels-section',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    AppGenericCarouselComponent,
    CarouselItemDirective,
    LucideAngularModule
  ],
  templateUrl: './reels-section.component.html', providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Sparkle,
        Heart
      })
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ReelsSectionComponent implements OnInit, OnDestroy {

  // ── Estado del modal ─────────────────────────────────────────────────────
  showModal = false;
  selectedReel: any = null;
  isMediaLoading = true;
  modalStyles = '';
  isMobile = false;
  currentMediaIndex = 0;
  isMuted = true;
  mediaWidth = 1080;
  mediaHeight = 1920;

  // ── Datos ────────────────────────────────────────────────────────────────
  reels: any[] = [];
  loadingReels = true;

  // ── Config del carousel ──────────────────────────────────────────────────
  // El objeto se recalcula en handleResize() para ajustar visibleItems
  carouselConfig: CarouselConfig = this.buildCarouselConfig(2);

  // ── Internos ─────────────────────────────────────────────────────────────
  private scrollPosition = 0;
  private destroy$ = new Subject<void>();
  private resizeSubject$ = new Subject<void>();
  private avatarColorCache = new Map<string, string>();
  private initialsCache = new Map<string, string>();
  private timestampCache = new Map<string, string>();

  constructor(
    private instagramService: InstagramserviceService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.resizeSubject$
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => this.handleResize());
  }

  @HostListener('window:resize')
  onResize() { this.resizeSubject$.next(); }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    await this.loadInstagramReels();

    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 1024;
      this.updateCarouselConfig();
      this.updateModalStyles();
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeSubject$.complete();
    this.avatarColorCache.clear();
    this.initialsCache.clear();
    this.timestampCache.clear();
  }

  // ── Carousel config helpers ───────────────────────────────────────────────

  /**
   * Devuelve cuántos slides mostrar según el ancho de ventana actual.
   * Replica los breakpoints: xs=2, sm=3, md=4, lg=5
   */
  private getVisibleItems(): number {
    if (!isPlatformBrowser(this.platformId)) return 2;
    const w = window.innerWidth;
    if (w >= 1280) return 5;
    if (w >= 1024) return 4;
    if (w >= 768) return 3;
    return 2;
  }

  private buildCarouselConfig(visibleItems: number): CarouselConfig {
    return {
      visibleItems,
      gap: 8,
      loop: true,
      showArrows: true,
      showIndicators: true,
      ornament: true,
      dragEnabled: true,
      animationDuration: 450,
    };
  }

  private updateCarouselConfig(): void {
    const visible = this.getVisibleItems();
    this.carouselConfig = this.buildCarouselConfig(visible);
    this.cdr.markForCheck();
  }

  // ── Resize handler ────────────────────────────────────────────────────────

  private handleResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 1024;

    this.updateCarouselConfig();

    if (wasMobile !== this.isMobile) {
      this.updateModalStyles();
    }

    this.cdr.markForCheck();
  }

  // ── Carga de datos ────────────────────────────────────────────────────────

  private async loadInstagramReels(): Promise<void> {
    this.loadingReels = true;
    this.cdr.markForCheck();
    try {
      const { data, error } = await this.instagramService.getInstagramReels();

      if (error || !data || data.length === 0) {
        this.reels = [];
        return;
      }

      this.reels = (data || []).slice(0, 6).map((item: any) =>
        Object.freeze({
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
          comments: Array.isArray(item.comments)
            ? Object.freeze(item.comments)
            : [],
          media: Object.freeze(
            item.media || [{
              url: item.media_url,
              type: item.media_type === 'VIDEO' || item.media_type === 'REELS'
                ? 'video'
                : 'image',
            }]
          ),
          profile_picture_url: item.profile_picture_url || '',
          username: item.username || 'aldana_vilcabana',
        })
      );
    } catch {
      this.reels = [];
    } finally {
      this.loadingReels = false;
      this.cdr.markForCheck();
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  updateModalStyles(): void {
    this.modalStyles = this.isMobile
      ? 'fixed inset-0 w-screen h-screen m-0 p-0 bg-white rounded-none overflow-hidden'
      : 'w-auto max-h-[100vh] rounded-xl overflow-hidden shadow-2xl';
  }

  /**
   * Se llama desde el template cuando el usuario hace click en un slide.
   * El carousel emite el índice mediante (slideChange) o podés usar click directo
   * en el template — acá recibimos el índice del reel.
   */
  openModal(index: number): void {
    const reel = this.reels[index];
    if (!reel) return;

    this.selectedReel = reel;
    this.currentMediaIndex = 0;
    this.isMuted = true;
    const mediaType = String(reel.media_type || '').toLowerCase();
    this.isMediaLoading = !mediaType.includes('video') && !mediaType.includes('reels');
    this.showModal = true;
    this.cdr.markForCheck();
    this.forcePlayVideo();
  }

  onModalChange(isOpen: boolean): void {
    this.showModal = isOpen;
    if (!isOpen) {
      setTimeout(() => {
        this.currentMediaIndex = 0;
        this.selectedReel = null;
        this.cdr.markForCheck();
      }, 200);
    } else {
      this.forcePlayVideo();
    }
  }

  // ── Media helpers ─────────────────────────────────────────────────────────

  private forcePlayVideo(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Esperar a que el DOM renderice el <video>
    setTimeout(() => {
      const videos = document.querySelectorAll<HTMLVideoElement>('video');
      videos.forEach((v) => {
        v.muted = true;
        v.play().catch(() => {
          // Si falla sin mute, ya está muted — no hay más que hacer
        });
      });
    }, 200);
  }

  onMediaLoaded(event?: Event): void {
    if (event) {
      const target = event.target as HTMLImageElement;
      if (target && 'naturalWidth' in target) {
        this.mediaWidth = target.naturalWidth || 1080;
        this.mediaHeight = target.naturalHeight || 1920;
      }
    }
    this.isMediaLoading = false;
    this.cdr.markForCheck();
  }

  onVideoError(): void {
    if (this.selectedReel) {
      this.selectedReel.media_url = '';
    }
    this.isMediaLoading = false;
    this.cdr.markForCheck();
  }

  get currentMedia() {
    if (!this.selectedReel) return { url: '', type: 'image' };

    const mediaType = String(this.selectedReel.media_type || '').toLowerCase();
    const isVideoType = mediaType.includes('video') || mediaType.includes('reels');

    // Si es video y tiene URL de video directa (mp4)
    if (isVideoType && this.selectedReel.media_url) {
      return {
        url: this.selectedReel.media_url,
        type: 'video',
      };
    }

    // Para carousel o fallback a imagen de thumbnail si no hay stream mp4
    if (!this.selectedReel.media || this.selectedReel.media.length === 0) {
      return { url: this.selectedReel.image_url || '', type: 'image' };
    }
    const m = this.selectedReel.media[this.currentMediaIndex];
    const rawType = String(m?.type || m?.media_type || '').toLowerCase();
    const isMVideo = (rawType.includes('video') || rawType.includes('reels')) && !!(m?.url || m?.media_url);
    return {
      url: m?.url || m?.media_url || m?.image_url || this.selectedReel.image_url || '',
      type: isMVideo ? 'video' : 'image',
    };
  }

  get hasMultipleMedia(): boolean {
    return this.selectedReel?.media && this.selectedReel.media.length > 1;
  }

  get mediaContainerWidth(): number {
    if (this.isMobile) {
      return 0;
    }
    const viewportHeight = window.innerHeight * 0.95;
    return Math.round(
      (this.mediaWidth * viewportHeight) / this.mediaHeight
    );
  }

  nextMedia(): void {
    if (this.selectedReel?.media &&
      this.currentMediaIndex < this.selectedReel.media.length - 1) {
      this.currentMediaIndex++;
      this.isMediaLoading = true;
      this.isMuted = true;
      this.cdr.markForCheck();
      this.forcePlayVideo();
    }
  }

  prevMedia(): void {
    if (this.currentMediaIndex > 0) {
      this.currentMediaIndex--;
      this.isMediaLoading = true;
      this.isMuted = true;
      this.cdr.markForCheck();
      this.forcePlayVideo();
    }
  }

  goToMedia(index: number): void {
    this.currentMediaIndex = index;
    this.isMediaLoading = true;
    this.isMuted = true;
    this.cdr.markForCheck();
    this.forcePlayVideo();
  }

  openInInstagram(): void {
    const url = this.selectedReel?.post_url;
    if (url && isPlatformBrowser(this.platformId)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    if (isPlatformBrowser(this.platformId)) {
      const videos = document.querySelectorAll('video');
      videos.forEach((v) => {
        v.muted = this.isMuted;
        if (v.paused) {
          v.play().catch(() => {});
        }
      });
    }
    this.cdr.markForCheck();
  }


  isVideo(media: any): boolean {
    if (!media) return false;
    const type = String(media.type || media.media_type || '').toLowerCase();
    return type.includes('video') || type.includes('reels');
  }

  /**
   * Genera la URL embed de Instagram a partir del permalink.
   * Ejemplo: https://www.instagram.com/reel/ABC123/ → https://www.instagram.com/p/ABC123/embed/
   */
  getEmbedUrl(reel: any): SafeResourceUrl {
    const postUrl: string = reel?.post_url || '';
    const match = postUrl.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
    const shortcode = match ? match[2] : '';
    const embedUrl = shortcode
      ? `https://www.instagram.com/p/${shortcode}/embed/`
      : postUrl;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // ── Scroll lock ───────────────────────────────────────────────────────────


  // ── Avatar helpers ────────────────────────────────────────────────────────

  getInitials(username: string): string {
    if (!username) return '?';
    if (this.initialsCache.has(username)) return this.initialsCache.get(username)!;

    const clean = username.replace('@', '').trim();
    let result: string;

    if (clean.includes(' ')) {
      const words = clean.split(/\s+/);
      result = words.length === 1
        ? words[0].substring(0, 2).toUpperCase()
        : (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else if (clean.includes('_')) {
      const parts = clean.split('_');
      result = parts.length === 1
        ? parts[0].substring(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else {
      result = clean.substring(0, 2).toUpperCase();
    }

    this.initialsCache.set(username, result);
    return result;
  }

  getAvatarColor(username: string): string {
    if (this.avatarColorCache.has(username)) return this.avatarColorCache.get(username)!;

    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B4D9', '#AED581', '#FFB74D', '#9575CD',
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    const color = colors[Math.abs(hash) % colors.length];
    this.avatarColorCache.set(username, color);
    return color;
  }

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
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    return gradients[Math.abs(hash) % gradients.length];
  }

  // ── Format ────────────────────────────────────────────────────────────────

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return 'Fecha desconocida';
    if (this.timestampCache.has(timestamp)) return this.timestampCache.get(timestamp)!;
    if (timestamp.includes('Hace')) {
      this.timestampCache.set(timestamp, timestamp);
      return timestamp;
    }

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let result: string;
      if (diffMins < 60) result = `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
      else if (diffHours < 24) result = `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      else result = `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;

      this.timestampCache.set(timestamp, result);
      return result;
    } catch {
      return 'Fecha desconocida';
    }
  }

  // ── TrackBy ───────────────────────────────────────────────────────────────

  trackByReelId(_index: number, reel: any): any { return reel.id; }
  trackByCommentIndex(index: number): number { return index; }
  trackByMediaIndex(index: number): number { return index; }
}