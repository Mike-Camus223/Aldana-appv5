import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AppMenuItem } from '../../utils/models/app-menu-item.model';


@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule],
  templateUrl: './breadcrump.component.html',
  styleUrls: ['./breadcrump.component.css']
})
export class BreadcrumbComponent {
  @Input() items: AppMenuItem[] = [];

  constructor(private router: Router) {}

  isActive(item: AppMenuItem): boolean {
    return item.route === this.router.url;
  }
}
