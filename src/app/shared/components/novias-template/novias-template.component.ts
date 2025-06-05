import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

@Component({
  selector: 'app-novias-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './novias-template.component.html',
  styleUrls: ['./novias-template.component.css']
})
export class NoviasTemplateComponent implements AfterViewInit, OnDestroy {
  @ViewChild('bgVideo') bgVideoRef!: ElementRef<HTMLVideoElement>;

  private observer!: IntersectionObserver;
  private hasUserInteracted = false;

  isMuted = signal(true);
  isVideoPlaying = signal(false);
  videoVisible = signal(false);

  images = [
    {url: 'https://picsum.photos/id/229/600/600', alt: 'Image 1'},
    {url: 'https://picsum.photos/id/429/600/600', alt: 'Image 1'},
    {url: 'https://picsum.photos/id/629/600/600', alt: 'Image 1'},
    {url: 'https://picsum.photos/id/329/600/600', alt: 'Image 1'},
    {url: 'https://picsum.photos/id/459/600/600', alt: 'Image 1'},
    {url: 'https://picsum.photos/id/149/600/600', alt: 'Image 1'},
    {url: 'https://picsum.photos/id/159/600/600', alt: 'Image 1'},
    {url: 'https://picsum.photos/id/267/600/600', alt: 'Image 1'},
  ];

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

  ngAfterViewInit(): void {
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

    this.observer.observe(document.querySelector('#novias-video-section')!);

    Fancybox.bind("[data-fancybox='gallery']", {
      Thumbs: true,
      Toolbar: {
        display: {
          left: [],
          middle: [],
          right: ['toggleZoom', 'slideshow', 'fullscreen', 'thumbs', 'close'],
        },
      },
    });
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }
}
