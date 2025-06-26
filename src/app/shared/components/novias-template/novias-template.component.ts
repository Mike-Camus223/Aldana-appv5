import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoComponent } from '../video/video.component';
import { MediaItem } from '../../utils/models/objectsGallery.model';
import { GalleryGenComComponent } from '../gallery-gen-com/gallery-gen-com.component';


@Component({
  selector: 'app-novias-template',
  standalone: true,
  imports: [CommonModule, GalleryGenComComponent, VideoComponent],
  templateUrl: './novias-template.component.html',
  styleUrls: ['./novias-template.component.css'],
})
export class NoviasTemplateComponent {
  images: MediaItem[] = [
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/1.jpg',
      alt: 'CN1',
      caption: 'Cande 1',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/3.jpg',
      alt: 'CN2',
      caption: 'Cande 2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/cande2fixed.jpg',
      alt: 'CN3',
      caption: 'Cande 3',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/4.jpg',
      alt: 'CN2',
      caption: 'Cande 4',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/5.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/cande6fixed.jpg',
      alt: 'Video desfile',
      caption: 'Desfile de la colección',
      type: 'video',
      width: 1280,
      height: 720,
      fit: 'contain',
    },
  ];

  onMediaClick(item: MediaItem) {
    console.log('Media clickeada:', item);
  }
}
