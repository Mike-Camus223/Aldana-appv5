import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { NewsletterService } from '../../../../core/services/newsletter/newsletter.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Heart, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Mail, MessageCircle, Send, ShoppingBag, User, UserRound, Check } from 'lucide-angular';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Send,
        User,
        Heart,
        ShoppingBag,
        MessageCircle,
        UserRound,
        Mail,
        Check
      })
    }
  ]
})
export class ControlPanelComponent implements OnInit {

  private authService = inject(AuthService);
  private newsletterService = inject(NewsletterService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  user = this.authService.currentUser$;
  isNewsletterSubscribed = false;
  isLoadingNewsletter = false;

  ngOnInit(): void {
    this.newsletterService.isSubscribed$.subscribe(subscribed => {
      this.isNewsletterSubscribed = subscribed;
      this.cdr.detectChanges();
    });
  }

  Gotofav() {
    this.router.navigate(['/panel/favoritos']);
  }

  GotoAccountInfo() {
    this.router.navigate(['/panel/informacion-cuenta']);
  }

  async toggleNewsletter(): Promise<void> {
    if (this.isLoadingNewsletter) return;
    this.isLoadingNewsletter = true;
    this.cdr.detectChanges();

    try {
      if (this.isNewsletterSubscribed) {
        const res = await this.newsletterService.unsubscribe();
        if (res.success) {
          this.notificationService.showSuccess('Suscripción cancelada', 'Te has desuscrito del newsletter correctamente.');
        } else {
          this.notificationService.showError('Error', res.error || 'No se pudo cancelar la suscripción.');
        }
      } else {
        const res = await this.newsletterService.subscribe(undefined, 'panel_usuario', true);
        if (res.success) {
          if (res.alreadySubscribed) {
            this.notificationService.showInfo('Ya suscrito', 'Tu correo ya se encuentra registrado en el newsletter.');
          } else {
            this.notificationService.showSuccess('¡Suscripción exitosa!', 'Te has suscrito al newsletter correctamente.');
          }
        } else {
          this.notificationService.showError('Error al suscribir', res.error || 'No se pudo completar la suscripción.');
        }
      }
    } finally {
      this.isLoadingNewsletter = false;
      this.cdr.detectChanges();
    }
  }
}
