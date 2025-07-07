import {
  Component,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-sec-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-sec-home.component.html',
  styleUrl: './about-sec-home.component.css',
})
export class AboutSecHomeComponent {
  @Input() AboutData: {
  maxWidthTittle: string;
  title: string;
  text: string;
  image: string;
  imageOrderMobile: string;
  imageOrderDesktop: string;
  textOrderMobile: string;
  textOrderDesktop: string;
  overlapTitle?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  titleOffsetClass?: string; 
}[] = [];

}
