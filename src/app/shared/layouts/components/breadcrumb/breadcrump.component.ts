import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AppMenuItem } from '../../../models/app-menu-item.model';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrump.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./breadcrump.component.css']
})
export class BreadcrumbComponent {
  @Input() items: AppMenuItem[] = [];

  constructor(private router: Router) {}

  isActive(item: AppMenuItem): boolean {
    return item.route === this.router.url;
  }
}
