import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DualSectionComponent } from "../../../../shared/components/generic/dual-section/dual-section.component";
import { AboutSecHomeComponent } from '../../../../shared/components/sections/about-sec-home/about-sec-home.component';
import { ReelsSectionComponent } from "../../../../shared/components/sections/reels-section/reels-section.component";
import { BettercustomDualComponent } from '../../../../shared/components/generic/bettercustom-dual/bettercustom-dual.component';
import { DinamicTitlesComponent } from '../../../../shared/components/generic/dinamic-titles/dinamic-titles.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, DualSectionComponent, DinamicTitlesComponent, AboutSecHomeComponent, BettercustomDualComponent, ReelsSectionComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

  bloquesSobreMi = [
    {
      title: 'Del Juego a la Pasión.',
      text: 'EL UNICO MODO DE HACER UN GRAN TRABAJO, ES AMAR LO QUE HACES.',
      useAnotherText: true,
      anotherText: '- Steve Jobs',
      image: 'assets/images/loadingIMG/loading1.jpg',
      imageOrderMobile: 'order-2',
      imageOrderDesktop: 'md:order-2',
      textOrderMobile: 'order-1',
      textOrderDesktop: 'md:order-1',
      buttonText: 'DESCUBRIR LA HISTORIA',
      buttonUrl: '/acerca-de-mi',
      maxWidthTittle: 'lg:min-w-xl xl:min-w-2xl min-w-full',
      titleOffsetClass: 'transition-all duration-500 ease-in-out'
    }
  ];
}
