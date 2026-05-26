import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AboutSecHomeComponent } from '../../../../shared/components/sections/about-sec-home/about-sec-home.component';
import { ReelsSectionComponent } from "../../../../shared/components/sections/reels-section/reels-section.component";
import { DualSectionComponent } from "../../../../shared/components/generic/dual-section/dual-section.component";
import { WordRevealDirective } from '../../../../shared/utils/directives/word-reveal.directive';
import { AboutSecHomev2Component } from '../../../../shared/components/sections/about-sec-homev2/about-sec-homev2.component';
import { TriplesectionComponent } from '../../../../shared/components/sections/triplesection/triplesection.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, WordRevealDirective, AboutSecHomeComponent, ReelsSectionComponent, DualSectionComponent ,TriplesectionComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export class HomeComponent {

}
