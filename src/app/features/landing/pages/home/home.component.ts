import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AboutSecHomeComponent } from '../../../../shared/components/sections/about-sec-home/about-sec-home.component';
import { ReelsSectionComponent } from "../../../../shared/components/sections/reels-section/reels-section.component";
import { WordRevealDirective } from '../../../../shared/directives/animations/word-reveal.directive';
import { TriplesectionComponent } from '../../../../shared/components/sections/triplesection/triplesection.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, WordRevealDirective, ReelsSectionComponent, TriplesectionComponent, AboutSecHomeComponent],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: ``
})
export class HomeComponent {

}
