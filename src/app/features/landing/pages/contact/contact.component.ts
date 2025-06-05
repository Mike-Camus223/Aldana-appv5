import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContactTemplateComponent } from '../../../../shared/components/contact-template/contact-template.component';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';

@Component({
  selector: 'app-contact',
  imports: [CommonModule,RouterModule,ContactTemplateComponent,BreadcrumbComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {

   breadcrumbItems: AppMenuItem[] = [
    { icon: 'pi pi-home', route: '/home' },
    { label: 'Contacto', route: '/contact' }
  ];
}
