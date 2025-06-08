import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/data-access/supabase.service';
import { GenericDataPage, GenericDataSection } from '../../utils/models/dinamicPages.model';

@Component({
  selector: 'app-about-template',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-template.component.html',
  styleUrls: ['./about-template.component.css']
})

export class AboutTemplateComponent implements AfterViewInit, OnDestroy, OnInit {
  private hasUserInteracted = false;
  isMuted = signal(true);
  videoVisible = signal(false);
  isVideoPlaying = signal(false);

  @ViewChild('bgVideo') bgVideoRef!: ElementRef<HTMLVideoElement>;
  private observer!: IntersectionObserver;
  pageData: GenericDataPage | null = null;


  constructor(private supabaseService: SupabaseService) { }

  async ngOnInit(): Promise<void> {
  try {
    const page = await this.supabaseService.getContentForPages<GenericDataPage>('sobre-aldana');

    if (!page || !page.generic_data_sections) {
      return;
    }
    page.generic_data_sections.sort((a, b) => a.section_order - b.section_order);
        page.generic_data_sections.forEach(section => {
      section.generic_data_contents.sort((a, b) => a.content_order - b.content_order);
    });

    this.pageData = page;
  } catch (error) {
  }
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
