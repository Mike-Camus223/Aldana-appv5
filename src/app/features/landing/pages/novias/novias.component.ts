import { Component } from '@angular/core';
import { NoviasTemplateComponent } from "../../../../shared/components/novias-template/novias-template.component";
import { BreadcrumbComponent } from "../../../../shared/components/breadcrump/breadcrump.component";
import { RouterModule } from '@angular/router';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';

@Component({
  selector: 'app-novias',
  imports: [NoviasTemplateComponent, BreadcrumbComponent, RouterModule],
  templateUrl: './novias.component.html',
  styleUrl: './novias.component.css'
})
export class NoviasComponent {
  breadcrumbItemsNovias: AppMenuItem[] = [
    { icon: 'pi pi-home', route: '/home' },
    { label: 'Novias', route: '/novias' }
  ];


}
