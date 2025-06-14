import { Component } from '@angular/core';
import { CarouselPublicComponent } from '../../../../shared/components/carousel-public/carousel-public.component';
import { RecomendationSecComponent } from '../../../../shared/components/recomendation-sec/recomendation-sec.component';
import { GridoptionsComponent } from "../../../../shared/components/gridoptions/gridoptions.component";
import { LocationComponent } from '../../../../shared/components/location/location.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CarouselPublicComponent, RecomendationSecComponent, GridoptionsComponent, LocationComponent, RouterModule],
  templateUrl: './home.component.html',
  styles: ``
})
export  class HomeComponent {

}
