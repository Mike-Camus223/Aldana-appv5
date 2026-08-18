import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BreadcrumbComponent } from '../../../../shared/components/system/breadcrump/breadcrump.component';
import { RouterModule } from '@angular/router';
import { AppMenuItem } from '../../../../shared/utils/models/app-menu-item.model';
import { StoreTemplateComponent } from '../../../../shared/components/templates/store-template/store-template.component';

@Component({
  selector: 'app-shop',
  imports: [BreadcrumbComponent,RouterModule,StoreTemplateComponent],
  templateUrl: './shop.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './shop.component.css'
})
export class ShopComponent {

  breadcrumbItemsShop: AppMenuItem[] = [
    {label: 'INICIO', route: '/'},
    {label: 'TIENDA', route: '/store'}
  ];

}
