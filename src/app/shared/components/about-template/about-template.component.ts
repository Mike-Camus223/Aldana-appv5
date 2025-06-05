import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-template.component.html',
  styleUrls: ['./about-template.component.css']
})
export class AboutTemplateComponent implements AfterViewInit, OnDestroy {
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

    const target = document.querySelector('#about-section');
    if (target) this.observer.observe(target);
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }

  isPlaying() {
    return this.isVideoPlaying();
  }

  isMutedIcon() {
    return this.isMuted();
  }
}
