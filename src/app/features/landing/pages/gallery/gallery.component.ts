import { Component } from '@angular/core';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';
import { RouterModule } from '@angular/router';
import { GenericGalleryTemplComponent } from '../../../../shared/components/generic-gallery-templ/generic-gallery-templ.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [BreadcrumbComponent, RouterModule, GenericGalleryTemplComponent],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent {

  breadcrumbItems: AppMenuItem[] = [
    { icon: 'pi pi-home', route: '/home' },
    { label: 'Galeria', route: '/gallery' }
  ];


}
