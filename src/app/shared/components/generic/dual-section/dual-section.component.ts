import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';

@Component({
  selector: 'app-dual-section',
  imports: [CommonModule,RouterModule,WordRevealDirective],
  templateUrl: './dual-section.component.html',
  styleUrl: './dual-section.component.css'
})
export class DualSectionComponent {

}
