import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LinkHoverUnderlineDirective } from '../../utils/directives/link-hover-underline.directive';
import { RouterModule } from '@angular/router';
import { WordRevealDirective } from '../../utils/directives/word-reveal.directive';

@Component({
  selector: 'app-dual-section',
  imports: [CommonModule,LinkHoverUnderlineDirective,RouterModule,WordRevealDirective],
  templateUrl: './dual-section.component.html',
  styleUrl: './dual-section.component.css'
})
export class DualSectionComponent {

}
