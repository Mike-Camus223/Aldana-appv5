import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarPublicv2Component } from "../../components/navbar-publicv2/navbar-publicv2.component";
import { Footerv2Component } from '../../components/footerv2/footerv2.component';
import { LoadingScreenComponent } from "../../components/loading-screen/loading-screen.component";
import { LoadingScreenGenericComponent } from '../../components/loading-screen-generic/loading-screen-generic.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarPublicv2Component,
    Footerv2Component,
    LoadingScreenComponent,
    LoadingScreenGenericComponent
  ],
  templateUrl: './public-layout.component.html',
  styles: ``
})
export class PublicLayoutComponent {
  loading = true;

  onLoadingFinished(): void {
    this.loading = false;
  }  
}
