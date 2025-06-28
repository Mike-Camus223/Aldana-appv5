import { Component } from '@angular/core';
import { CarouselPublicComponent } from '../../../../shared/components/carousel-public/carousel-public.component';
import { RecomendationSecComponent } from '../../../../shared/components/recomendation-sec/recomendation-sec.component';
import { GridoptionsComponent } from "../../../../shared/components/gridoptions/gridoptions.component";
import { LocationComponent } from '../../../../shared/components/location/location.component';
import { RouterModule } from '@angular/router';
import { DualSectionComponent } from "../../../../shared/components/dual-section/dual-section.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ LocationComponent, RouterModule, DualSectionComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export  class HomeComponent {

}
