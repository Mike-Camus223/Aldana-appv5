import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AcordiongenericComponent } from '../../generic/acordiongeneric/acordiongeneric.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Heart, Send } from 'lucide-angular';
import { NewsletterService } from '../../../../core/services/newsletter/newsletter.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-footerv2',
  standalone: true,
  imports: [RouterModule, AcordiongenericComponent, LucideAngularModule],
  templateUrl: './footerv2.component.html',
  styleUrl: './footerv2.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Heart, Send })
    }
  ]
})
export class Footerv2Component {

  private newsletterService = inject(NewsletterService);
  private notificationService = inject(NotificationService);

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

    const res = await this.newsletterService.subscribe(email, 'footer', true);
    if (res.success) {
      if (res.alreadySubscribed) {
        this.notificationService.showInfo(
          'Correo ya suscrito',
          'Este correo ya se encuentra suscrito al newsletter. Si tienes una cuenta, puedes gestionarlo desde tu panel de control.'
        );
      } else {
        this.notificationService.showSuccess(
          '¡Suscripción exitosa!',
          'Gracias por suscribirte al newsletter de Aldana Vilcabana. Revisa tu correo con tu beneficio.'
        );
        input.value = '';
      }
    } else {
      this.notificationService.showError('Error al suscribir', res.error || 'No se pudo procesar la suscripción.');
    }
  }
}