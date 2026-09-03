import { RevealDirection } from './../../../../shared/directives/animations/card-init-animation.directive';
import { AppMenuItem } from './../../../../shared/models/app-menu-item.model';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbComponent } from "../../../../shared/components/system/breadcrump/breadcrump.component";
import { AboutTemplateComponent } from "../../../../shared/components/templates/about-template/about-template.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [BreadcrumbComponent, AboutTemplateComponent,RouterModule],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './about.component.css'
})
export class AboutComponent {

  breadcrumbItemsAbout: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'ACERCA DE MÍ', route: '/acerca-de-mi' }
  ];


}
