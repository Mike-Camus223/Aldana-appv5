import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  Input,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video.component.html',
  styleUrl: './video.component.css',
})
export class VideoComponent implements AfterViewInit, OnDestroy {
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

  private observer!: IntersectionObserver;

  ngAfterViewInit() {
    const video = this.bgVideoRef.nativeElement;
    video.muted = this.muted;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.videoVisible.set(entry.isIntersecting);

        if (!this.hasUserInteracted && this.autoplay) {
          if (entry.isIntersecting) {
            video.play();
            this.isVideoPlaying.set(true);
          } else {
            video.pause();
            this.isVideoPlaying.set(false);
          }
        }
      },
      { threshold: 0.5 }
    );

    this.observer.observe(video);
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }

  togglePlay() {
    this.hasUserInteracted = true;
    const video = this.bgVideoRef.nativeElement;
    if (video.paused) {
      video.play();
      this.isVideoPlaying.set(true);
    } else {
      video.pause();
      this.isVideoPlaying.set(false);
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
