import { Component } from '@angular/core';
import { LocationComponent } from '../../../../shared/components/location/location.component';
import { RouterModule } from '@angular/router';
import { DualSectionComponent } from "../../../../shared/components/dual-section/dual-section.component";
import { AboutSecHomeComponent } from '../../../../shared/components/about-sec-home/about-sec-home.component';
import { CollageGalleryComponent } from "../../../../shared/components/collage-gallery/collage-gallery.component";
import { BettercustomDualComponent } from "../../../../shared/components/bettercustom-dual/bettercustom-dual.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, DualSectionComponent, AboutSecHomeComponent, BettercustomDualComponent],
  templateUrl: './home.component.html',
  styles: ``
})
export  class HomeComponent {


  bloquesSobreMi = [
  {
    title: 'Aldana Vilcabana',
    text: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ullam omnis iste tempora voluptatibus quos expedita, fugit alias rerum harum laboriosam at sit est possimus dolorum officiis nam, obcaecati ipsam quas Quibusdam assumenda fuga nulla error maiores? Doloribus tenetur tempora odit voluptatem ipsum neque in magnam sequi quidem, asperiores quis hic. Quibusdam voluptas consequuntur maxime qui. Expedita eum possimus exercitationem pariatur.',
    image: 'https://picsum.photos/id/1015/400/500',
    imageOrderMobile: 'order-2',
    imageOrderDesktop: 'md:order-1',
    textOrderMobile: 'order-1',
    textOrderDesktop: 'md:order-2'
  },
  {
    title: 'Segundo Titulo',
    text: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Ullam omnis iste tempora voluptatibus quos expedita, fugit alias rerum harum laboriosam at sit est possimus dolorum officiis nam, obcaecati ipsam quas Quibusdam assumenda fuga nulla error maiores? Doloribus tenetur tempora odit voluptatem ipsum neque in magnam sequi quidem, asperiores quis hic. Quibusdam voluptas consequuntur maxime qui. Expedita eum possimus exercitationem pariatur.',
    image: 'https://picsum.photos/id/1016/400/500',
    imageOrderMobile: 'order-1',
    imageOrderDesktop: 'md:order-2',
    textOrderMobile: 'order-2',
    textOrderDesktop: 'md:order-1'
  }
];




}
