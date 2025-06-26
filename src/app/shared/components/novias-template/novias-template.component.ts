import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoComponent } from '../video/video.component';
import { MediaItem } from '../../utils/models/objectsGallery.model';
import { GalleryGenComComponent } from '../gallery-gen-com/gallery-gen-com.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-novias-template',
  standalone: true,
  imports: [CommonModule, GalleryGenComComponent, VideoComponent],
  templateUrl: './novias-template.component.html',
  styleUrls: ['./novias-template.component.css'],
})
export class NoviasTemplateComponent {

 titulos = [
  {
    title:'CORSET JARDÍN Y PANTALÓN TUTOR'
  },
  {
    title: 'VESTIDO PÉTALOS'
  },
  {
    title: 'VESTIDO LLUVIA'
  },
  {
    title: 'VESTIDO CALA'
  },
  {
    title: 'CORSET ORQUÍDEA Y FALDA GERANIO'
  }
 ]

  images: MediaItem[] = [
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande1.jpg',
      alt: 'CN1',
      type: 'image',
      fit: 'contain',
      caption: 'CORSET JARDÍN Y PANTALÓN TUTOR'
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande3.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande2.jpg',
      alt: 'CN3',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande4.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande5.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande/cande6.jpg',
      alt: 'Video desfile',
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
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/deilfi11.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi3.jpg',
      alt: 'CN3',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi7.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi6.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi/delfi12.jpg',
      alt: 'Video desfile',
      type: 'video',
      width: 1280,
      height: 720,
      fit: 'contain',
    },
  ];

  images3:MediaItem[] = [
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Vicky/vicky1.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Vicky/vicky4.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Vicky/vicky3.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Vicky/vicky5.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Vicky/vicky6.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Vicky/vicky2.jpg',
      alt: 'Video desfile',
      type: 'video',
      width: 1280,
      height: 720,
      fit: 'contain',
    },
  ]

  images4: MediaItem[] = [
     {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande%20Cala/candecala1.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
     {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande%20Cala/candecala5.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
     {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande%20Cala/candecala3.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande%20Cala/candecala2.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande%20Cala/candecala4.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Cande%20Cala/candecala6.jpg',
      alt: 'Video desfile',
      type: 'video',
      width: 1280,
      height: 720,
      fit: 'contain',
    },
  ]

  images5: MediaItem[] = [
     {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi%20Corset%20Orquidea/delficorse3.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    }, 
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi%20Corset%20Orquidea/delficorse1.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi%20Corset%20Orquidea/delficorse5.jpg',
      alt: 'CN2',
      type: 'image',
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi%20Corset%20Orquidea/delficorse6.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi%20Corset%20Orquidea/delficorse4.jpg',
      alt: 'Video desfile',
      type: 'video',
      width: 1280,
      height: 720,
      fit: 'contain',
    },
    {
      url: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi%20Corset%20Orquidea/delficorse7.mp4',
      poster: 'https://cddrmboopihkiuyomxle.supabase.co/storage/v1/object/public/aldana-app/%20collections/Jardin%20secreto/Novias/Delfi%20Corset%20Orquidea/delficorse2.jpg',
      alt: 'Video desfile',
      type: 'video',
      width: 1280,
      height: 720,
      fit: 'contain',
    },
  ]

  onMediaClick(item: MediaItem) {
    console.log('Media clickeada:', item);
  }
}
