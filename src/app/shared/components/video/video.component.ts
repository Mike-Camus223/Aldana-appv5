import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  AfterViewInit,
  OnDestroy,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video.component.html',
  styleUrl: './video.component.css',
})
export class VideoComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('bgVideo') bgVideoRef!: ElementRef<HTMLVideoElement>;

  @Input() src!: string;
  @Input() height = 'min-h-[80vh]';
  @Input() width = 'w-full';
  @Input() objectFit = 'object-cover';
  @Input() autoplay = true;
  @Input() muted = true;
  @Input() showControls = true;
  @Input() gradientOverlay = true;

  private hasUserInteracted = false;
  isMuted = signal(true);
  isVideoPlaying = signal(false);
  videoVisible = signal(false);
  videoLoaded = signal(false);

  private observer!: IntersectionObserver;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['muted']) {
      this.isMuted.set(this.muted);
    }
  }

  ngAfterViewInit() {
  const video = this.bgVideoRef.nativeElement;
  video.muted = this.muted;
  this.isMuted.set(this.muted);

  video.addEventListener('loadedmetadata', () => {
    this.videoLoaded.set(true);
    console.log('Video metadata loaded');

    if (this.videoVisible() && this.autoplay) {
      this.playVideo();
    }
  });

  video.addEventListener('play', () => {
    this.isVideoPlaying.set(true);
  });

  video.addEventListener('pause', () => {
    this.isVideoPlaying.set(false);
  });

  this.observer = new IntersectionObserver(
    ([entry]) => {
      const isVisible = entry.isIntersecting;
      this.videoVisible.set(isVisible);

      if (!this.hasUserInteracted && this.autoplay && this.videoLoaded()) {
        if (isVisible) {
          this.playVideo();
        } else {
          this.pauseVideo();
        }
      }
    },
    { threshold: 0.5 }
  );

  this.observer.observe(video);
}

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private async playVideo() {
    const video = this.bgVideoRef.nativeElement;
    try {
      await video.play();
      this.isVideoPlaying.set(true);
    } catch (error) {
      console.warn('Error playing video:', error);
      this.isVideoPlaying.set(false);
    }
  }

  private pauseVideo() {
    const video = this.bgVideoRef.nativeElement;
    video.pause();
    this.isVideoPlaying.set(false);
  }

  async togglePlay() {
    this.hasUserInteracted = true;
    const video = this.bgVideoRef.nativeElement;
    
    if (video.paused) {
      await this.playVideo();
    } else {
      this.pauseVideo();
    }
  }

  toggleMute() {
    const video = this.bgVideoRef.nativeElement;
    video.muted = !video.muted;
    this.isMuted.set(video.muted);
  }

  isPlaying() {
    return this.isVideoPlaying();
  }

  isMutedIcon() {
    return this.isMuted();
  }
}