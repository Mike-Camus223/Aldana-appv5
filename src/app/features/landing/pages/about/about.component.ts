import { AppMenuItem } from './../../../../shared/utils/models/app-menu-item.model';
import { Component } from '@angular/core';
import { BreadcrumbComponent } from "../../../../shared/components/breadcrump/breadcrump.component";
import { AboutTemplateComponent } from "../../../../shared/components/about-template/about-template.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  imports: [BreadcrumbComponent, AboutTemplateComponent,RouterModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {

  breadcrumbItemsAbout: AppMenuItem[] = [
    { icon: 'pi pi-home', route: '/home' },
    { label: 'Acerca de mí', route: '/acerca-de' }
  ];


}
