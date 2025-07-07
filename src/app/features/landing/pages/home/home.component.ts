import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DualSectionComponent } from "../../../../shared/components/dual-section/dual-section.component";
import { AboutSecHomeComponent } from '../../../../shared/components/about-sec-home/about-sec-home.component';
import { ReelsSectionComponent } from "../../../../shared/components/reels-section/reels-section.component";
import { BettercustomDualComponent } from '../../../../shared/components/bettercustom-dual/bettercustom-dual.component';
import { DinamicTitlesComponent } from '../../../../shared/components/dinamic-titles/dinamic-titles.component';
 
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, DualSectionComponent,DinamicTitlesComponent ,  AboutSecHomeComponent, BettercustomDualComponent, ReelsSectionComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export  class HomeComponent {

bloquesSobreMi = [
  {
    title: 'Moda de autor & diseño exclusivo para novias',
    text: 'Aldana Vilcabana presenta su nueva propuesta en moda de diseño, con una colección de piezas únicas pensadas para mujeres auténticas. Esta es su primera incursión en el mundo digital, apostando por una experiencia elegante y personalizada.',
    image: 'assets/images/loadingIMG/loading1.jpg',
    imageOrderMobile: 'order-2',
    imageOrderDesktop: 'md:order-2',
    textOrderMobile: 'order-1',
    textOrderDesktop: 'md:order-1',
    buttonText: 'DESCUBRIR LA HISTORIA',
    buttonUrl: '/about/story',
    maxWidthTittle: 'lg:min-w-xl xl:min-w-2xl min-w-full',
    titleOffsetClass: 'transition-all duration-500 ease-in-out'
  }
];



}
