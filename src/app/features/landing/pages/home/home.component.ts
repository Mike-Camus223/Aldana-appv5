import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AboutSecHomeComponent } from '../../../../shared/components/sections/about-sec-home/about-sec-home.component';
import { ReelsSectionComponent } from "../../../../shared/components/sections/reels-section/reels-section.component";
import { DinamicTitlesComponent } from '../../../../shared/components/generic/dinamic-titles/dinamic-titles.component';
import { CarouselScreenComponent, CarouselSlide } from '../../../../shared/components/generic/carousel-screen/carousel-screen.component';
import { DualSectionComponent } from "../../../../shared/components/generic/dual-section/dual-section.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, DinamicTitlesComponent,CarouselScreenComponent, AboutSecHomeComponent, ReelsSectionComponent, DualSectionComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

 slides: CarouselSlide[] = [
  { 
    image: '../../../../assets/images/Novias.jpeg', 
    announcement: { 
      text: 'Descubre nuestra colección exclusiva de vestidos de novia para tu día más especial.', 
      buttonText: 'Ver Colección Novias', 
      buttonLink: '/novias' 
    } 
  },
  { 
    image: '../../../../assets/images/Chlotes.jpg',
    announcement: {
      text: 'Explora nuestra línea prêt-à-porter con diseños elegantes y contemporáneos.',
      buttonText: 'Ver Prêt-à-Porter',
      buttonLink: '/tienda'
    }
  }
];

  bloquesSobreMi = [
    {
      title: 'Del Juego a la Pasión.',
      text: 'Desde mis primeros diseños para muñecas, transformando retazos de tela en vestuarios imaginativos, hasta la creación de piezas exclusivas y a medida para mis clientas de hoy, una constante innegable ha marcado mi camino...',
      useAnotherText: false,
      image: 'assets/images/loadingIMG/loading1.jpg',
      imageOrderMobile: 'order-2',
      imageOrderDesktop: 'md:order-2',
      textOrderMobile: 'order-1',
      textOrderDesktop: 'md:order-1',
      buttonText: 'VER MÁS',
      buttonUrl: '/acerca-de-mi',
      maxWidthTittle: 'lg:min-w-xl xl:min-w-2xl min-w-full',
      titleOffsetClass: 'transition-all duration-500 ease-in-out',
      anotherText: '',
    }
  ];
}
