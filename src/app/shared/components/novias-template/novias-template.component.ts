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
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande1.jpg',
      alt: 'CN1',
      caption: 'CORSET JARDÍN Y PANTALÓN TUTOR',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande3.jpg',
      alt: 'CN2',
      caption: '',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande2.jpg',
      alt: 'CN3',
      caption: '',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande4.jpg',
      alt: 'CN2',
      caption: '',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande5.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande6.jpg',
      alt: 'Video desfile',
      caption: '',
      type: 'video',
      width: 1280,
      height: 720,
      fit: 'contain',
    },
  ];

  images2: MediaItem[] = [
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi1.jpeg',
      alt: 'CN1',
      caption: 'VESTIDO PÉTALOS',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/deilfi11.jpg',
      alt: 'CN2',
      caption: '',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi3.jpg',
      alt: 'CN3',
      caption: '',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi7.jpg',
      alt: 'CN2',
      caption: '',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi6.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi12.jpg',
      alt: 'Video desfile',
      caption: '',
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
