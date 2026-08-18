import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbComponent } from '../../../../shared/components/system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';
import { RouterModule } from '@angular/router';
import { GenericGalleryTemplComponent } from "../../../../shared/components/templates/generic-gallery-templ/generic-gallery-templ.component";


@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [BreadcrumbComponent, RouterModule, GenericGalleryTemplComponent],
  templateUrl: './gallery.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gallery.component.css'
})
export class GalleryComponent {

  breadcrumbItems: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'COLECCIONES', route: '/colecciones' }
  ];


}
