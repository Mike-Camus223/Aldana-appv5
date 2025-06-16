import {
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { VideoComponent } from '../video/video.component';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, ButtonModule, VideoComponent],
  templateUrl: './location.component.html',
  styleUrl: './location.component.css',
})
export class LocationComponent {
  
}
