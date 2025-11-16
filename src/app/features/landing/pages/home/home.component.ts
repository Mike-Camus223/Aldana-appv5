import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AboutSecHomeComponent } from '../../../../shared/components/sections/about-sec-home/about-sec-home.component';
import { ReelsSectionComponent } from "../../../../shared/components/sections/reels-section/reels-section.component";
import { CarouselSlide } from '../../../../shared/components/generic/carousel-screen/carousel-screen.component';
import { DualSectionComponent } from "../../../../shared/components/generic/dual-section/dual-section.component";
import { WordRevealDirective } from '../../../../shared/utils/directives/word-reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, WordRevealDirective, AboutSecHomeComponent, ReelsSectionComponent, DualSectionComponent],
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

}
