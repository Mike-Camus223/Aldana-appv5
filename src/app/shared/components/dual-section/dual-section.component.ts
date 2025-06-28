import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dual-section',
  imports: [CommonModule],
  templateUrl: './dual-section.component.html',
  styleUrl: './dual-section.component.css'
})
export class DualSectionComponent {
  @Input() hoverNavbar = false;

}
