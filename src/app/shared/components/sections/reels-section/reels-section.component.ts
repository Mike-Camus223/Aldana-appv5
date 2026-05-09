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
import { ModalComponent, } from '../../generic/modal/modal.component';
import { SupabaseService } from '../../../../core/services/data-access/supabase.service';
import { CarouselImagesGenericv2Component } from '../../generic/carousel-images-genericv2/carousel-images-genericv2.component';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-reels-section',
  standalone: true,
  imports: [CommonModule, ModalComponent, CarouselImagesGenericv2Component],
  templateUrl: './reels-section.component.html',
  styleUrls: ['./reels-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  currentMediaIndex = 0;
  isMuted = true;

  private scrollPosition = 0;
  private destroy$ = new Subject<void>();
  private resizeSubject$ = new Subject<void>();
  private avatarColorCache = new Map<string, string>();
  private initialsCache = new Map<string, string>();
  private timestampCache = new Map<string, string>();

  breakpoints: any = {
    '(min-width: 640px)': { slides: { perView: 2, spacing: 5 } },
    '(min-width: 768px)': { slides: { perView: 3, spacing: 5 } },
    '(min-width: 1024px)': { slides: { perView: 4, spacing: 5 } },
    '(min-width: 1280px)': { slides: { perView: 5, spacing: 5 } },
  };

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.resizeSubject$
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => this.handleResize());
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeSubject$.next();
  }

  private handleResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 1024;
      
      if (wasMobile !== this.isMobile) {
        this.updateModalStyles();
        this.cdr.markForCheck();
      }
    }
  }

  async ngOnInit(): Promise<void> {
    await this.loadInstagramReels();

    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 1024;
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
    this.unlockScroll();
  }

  onMediaLoaded(_event?: Event): void {
    this.isMediaLoading = false;
    this.cdr.markForCheck();
  }

  private async loadInstagramReels(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.getInstagramReels();

      if (error || !data || data.length === 0) {
        this.reels = [];
        this.cdr.markForCheck();
        return;
      }

      this.reels = data.map((item: any) => 
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
          comments: Array.isArray(item.comments) ? Object.freeze(item.comments) : [],
          media: Object.freeze(item.media || [{
            url: item.media_url,
            type: item.media_type === 'VIDEO' || item.media_type === 'REELS' ? 'video' : 'image',
          }]),
          profile_picture_url: item.profile_picture_url || '',
          username: item.username || 'aldana_vilcabana',
        })
      );

      this.cdr.markForCheck();
    } catch (error) {
      this.reels = [];
      this.cdr.markForCheck();
    }
  }

  updateModalStyles(): void {
    this.modalStyles = this.isMobile
      ? 'fixed inset-0 w-screen h-screen m-0 p-0 bg-white rounded-none overflow-hidden z-[9999]'
      : 'w-auto max-h-[90vh] rounded-sm';
  }

  formatTimestamp(timestamp: string): string {
    if (!timestamp) return 'Fecha desconocida';

    if (this.timestampCache.has(timestamp)) {
      return this.timestampCache.get(timestamp)!;
    }

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
      if (diffMins < 60) {
        result = `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        result = `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      } else {
        result = `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
      }
      
      this.timestampCache.set(timestamp, result);
      return result;
    } catch (e) {
      return 'Fecha desconocida';
    }
  }

  private lockScroll(): void {
    if (isPlatformBrowser(this.platformId) && this.isMobile) {
      this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
      document.body.classList.add('no-scroll');
    }
  }

  private unlockScroll(): void {
    if (isPlatformBrowser(this.platformId) && this.isMobile) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      document.body.classList.remove('no-scroll');
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
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.unlockScroll();
    this.cdr.markForCheck();
    
    setTimeout(() => {
      this.currentMediaIndex = 0;
      this.selectedReel = null;
      this.cdr.markForCheck();
    }, 200);
  }

  onModalChange(isOpen: boolean): void {
    this.showModal = isOpen;
    if (!isOpen) {
      this.unlockScroll();
      setTimeout(() => {
        this.currentMediaIndex = 0;
        this.selectedReel = null;
        this.cdr.markForCheck();
      }, 200);
    }
  }

  getInitials(username: string): string {
    if (!username) return '?';

    if (this.initialsCache.has(username)) {
      return this.initialsCache.get(username)!;
    }

    const cleanName = username.replace('@', '').trim();
    let result: string;

    if (!cleanName.includes(' ') && !cleanName.includes('_')) {
      result = cleanName.substring(0, 2).toUpperCase();
    } else if (cleanName.includes(' ')) {
      const words = cleanName.split(/\s+/);
      result = words.length === 1
        ? words[0].substring(0, 2).toUpperCase()
        : (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else if (cleanName.includes('_')) {
      const parts = cleanName.split('_');
      result = parts.length === 1
        ? parts[0].substring(0, 2).toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else {
      result = cleanName.substring(0, 2).toUpperCase();
    }

    this.initialsCache.set(username, result);
    return result;
  }

  getAvatarColor(username: string): string {
    if (this.avatarColorCache.has(username)) {
      return this.avatarColorCache.get(username)!;
    }

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
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    ];

    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    return gradients[Math.abs(hash) % gradients.length];
  }

  get currentMedia() {
    if (!this.selectedReel?.media || this.selectedReel.media.length === 0) {
      return { url: this.selectedReel?.image_url, type: 'image' };
    }
    return this.selectedReel.media[this.currentMediaIndex];
  }

  get hasMultipleMedia(): boolean {
    return this.selectedReel?.media && this.selectedReel.media.length > 1;
  }

  get hasComments(): boolean {
    return this.selectedReel?.comments && this.selectedReel.comments.length > 0;
  }

  nextMedia(): void {
    if (this.selectedReel?.media && this.currentMediaIndex < this.selectedReel.media.length - 1) {
      this.currentMediaIndex++;
      this.isMediaLoading = true;
      this.resetVideoState();
      this.cdr.markForCheck();
    }
  }

  prevMedia(): void {
    if (this.currentMediaIndex > 0) {
      this.currentMediaIndex--;
      this.isMediaLoading = true;
      this.resetVideoState();
      this.cdr.markForCheck();
    }
  }

  goToMedia(index: number): void {
    this.currentMediaIndex = index;
    this.isMediaLoading = true;
    this.resetVideoState();
    this.cdr.markForCheck();
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.cdr.markForCheck();
  }

  private resetVideoState(): void {
    this.isMuted = true;
  }

  isVideo(media: any): boolean {
    return media?.type === 'video';
  }

  trackByReelId(_index: number, reel: any): any {
    return reel.id;
  }

  trackByCommentIndex(index: number): number {
    return index;
  }

  trackByMediaIndex(index: number): number {
    return index;
  }
}