import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AcordiongenericComponent } from '../../../components/generic/acordiongeneric/acordiongeneric.component';
import { LucideAngularModule } from 'lucide-angular';
import { NewsletterService } from '../../../../core/services/newsletter/newsletter.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-footerv2',
  standalone: true,
  imports: [RouterModule, AcordiongenericComponent, LucideAngularModule],
  templateUrl: './footerv2.component.html',
  styleUrl: './footerv2.component.css',
  changeDetection: ChangeDetectionStrategy.Eager})
export class Footerv2Component {

  private newsletterService = inject(NewsletterService);
  private notificationService = inject(NotificationService);

  readonly currentYear = new Date().getFullYear();

  readonly tiendaItems: { label: string; slug: string }[] = [
    { label: 'New Drop', slug: 'new-drop' },
    { label: 'Novias', slug: 'novias' },
    { label: 'Sastrería', slug: 'sastreria' },
    { label: 'Camperas', slug: 'camperas' },
    { label: 'Accesorios', slug: 'accesorios' },
    { label: 'Pantalones y Faldas', slug: 'pantalones-y-faldas' },
    { label: 'Tops', slug: 'tops' },
    { label: 'Buzos', slug: 'buzos' },
    { label: 'Vestidos y Monos', slug: 'vestidos-y-monos' }
  ];

  mobileOpen: string | null = null;

  onMobileToggle(value: string): void {
    this.mobileOpen = this.mobileOpen === value ? null : value;
  }

  normalizeCategory(item: string | { label: string; slug: string }): string {
    if (typeof item !== 'string') {
      return item?.slug || '';
    }
    return item
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
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