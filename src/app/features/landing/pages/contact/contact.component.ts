
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContactTemplateComponent } from '../../../../shared/components/templates/contact-template/contact-template.component';
import { BreadcrumbComponent } from '../../../../shared/components/system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';

@Component({
  selector: 'app-contact',
  imports: [RouterModule, ContactTemplateComponent, BreadcrumbComponent],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {

   breadcrumbItems: AppMenuItem[] = [
    { label: 'INICIO', route: '/home' },
    { label: 'CONTACTO', route: '/contact' }
  ];
}
