import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Heart, Send } from 'lucide-angular';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';


@Component({
  selector: 'app-footerv2',
  standalone: true,
  imports: [CommonModule, RouterModule, AcordiongenericComponent, LucideAngularModule, CardInitAnimationDirective],
  templateUrl: './footerv2.component.html',
  styleUrl: './footerv2.component.css',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Heart, Send })
    }
  ]
})
export class Footerv2Component {

  readonly currentYear = new Date().getFullYear();

  readonly tiendaItems = [
    'Camisas',
    'Blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos'
  ];

  mobileOpen: string | null = null;

  onMobileToggle(value: string): void {
    this.mobileOpen = this.mobileOpen === value ? null : value;
  }

  normalizeCategory(item: string): string {
    return item
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  async onSubscribe(input: HTMLInputElement) {
    if (!input.checkValidity()) {
      input.reportValidity(); 
      return;
    }
    const email = input.value.trim();
    if (!email) return;

    input.value = '';
  }
}