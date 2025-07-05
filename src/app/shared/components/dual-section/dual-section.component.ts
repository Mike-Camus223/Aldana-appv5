import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LinkHoverUnderlineDirective } from '../../utils/directives/link-hover-underline.directive';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dual-section',
  imports: [CommonModule,LinkHoverUnderlineDirective,RouterModule],
  templateUrl: './dual-section.component.html',
  styleUrl: './dual-section.component.css'
})
export class DualSectionComponent {

}
