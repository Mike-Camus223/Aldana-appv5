import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WordRevealDirective } from '../../../../shared/directives/animations/word-reveal.directive';
import { BreadcrumbComponent } from '../../../../shared/components/system/breadcrump/breadcrump.component';
import { AppMenuItem } from '../../../../shared/models/app-menu-item.model';

@Component({
  selector: 'app-tailored',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    WordRevealDirective,
    BreadcrumbComponent
  ],
  templateUrl: './tailored.component.html',
  styleUrls: ['./tailored.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TailoredComponent {
  breadcrumbItems: AppMenuItem[] = [
    { label: 'INICIO', route: '/' },
    { label: 'A MEDIDA', route: '/a-medida' }
  ];
}
