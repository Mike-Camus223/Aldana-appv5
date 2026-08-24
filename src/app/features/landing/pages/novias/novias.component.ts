import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NoviasTemplateComponent } from "../../../../shared/components/templates/novias-template/novias-template.component";
import { BreadcrumbComponent } from "../../../../shared/components/system/breadcrump/breadcrump.component";
import { RouterModule } from '@angular/router';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';

@Component({
  selector: 'app-novias',
  standalone: true,
  imports: [NoviasTemplateComponent, BreadcrumbComponent, RouterModule],
  templateUrl: './novias.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './novias.component.css'
})
export class NoviasComponent {
  breadcrumbItemsNovias: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'NOVIAS COLECCIONES', route: '/novias-colecciones' }
  ];
}
