import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../components/footer/footer.component';
import { NavbarPublicComponent } from '../../components/navbar-public/navbar-public.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule,RouterOutlet,FooterComponent,NavbarPublicComponent],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export default class PublicLayoutComponent {

  
}
