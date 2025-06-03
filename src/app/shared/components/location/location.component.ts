import {
  Component,
  ElementRef,
  ViewChild,
  signal,
  AfterViewInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './location.component.html',
  styleUrl: './location.component.css',
})
export class LocationComponent implements AfterViewInit, OnDestroy {
  private hasUserInteracted = false;
  isMuted = signal(true);
  videoVisible = signal(false);
  isVideoPlaying = signal(false); 

  @ViewChild('bgVideo') bgVideoRef!: ElementRef<HTMLVideoElement>;
  private observer!: IntersectionObserver;

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

  ngAfterViewInit() {
    const video = this.bgVideoRef.nativeElement;
    video.muted = true;

    this.observer = new IntersectionObserver(
      ([entry]) => {
        this.videoVisible.set(entry.isIntersecting);

        if (!this.hasUserInteracted) {
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

    this.observer.observe(document.querySelector('#location-section')!);
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }

  isPlaying() {
    return this.isVideoPlaying();
  }

  isMutedIcon() {
    return this.isMuted();
  }
}
