import { Component } from '@angular/core';
import { BreadcrumbComponent } from '../../../../shared/components/breadcrump/breadcrump.component';
import { RouterModule } from '@angular/router';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';
import { StoreTemplateComponent } from '../../../../shared/components/store-template/store-template.component';

@Component({
  selector: 'app-shop',
  imports: [BreadcrumbComponent,RouterModule,StoreTemplateComponent],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent {

  breadcrumbItemsShop: AppMenuItem[] = [
    {label: 'INICIO', route: '/home'},
    {label: 'TIENDA', route: '/store'}
  ];

}
