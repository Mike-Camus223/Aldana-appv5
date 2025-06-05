import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../components/footer/footer.component';
import { NavbarPublicComponent } from '../../components/navbar-public/navbar-public.component';
import { NavbarPublicv2Component } from "../../components/navbar-publicv2/navbar-publicv2.component";
import { Footerv2Component } from '../../components/footerv2/footerv2.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarPublicv2Component,Footerv2Component],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export default class PublicLayoutComponent {

  
}
