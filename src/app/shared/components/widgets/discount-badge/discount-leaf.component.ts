import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ModalComponent} from '../../generic/modal/modal.component';
import { ModalAdsService } from '../../../../core/services/modal-ads.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-discount-leaf',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './discount-leaf.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './discount-leaf.component.css'
})
export class DiscountLeafComponent implements OnInit {
  private modalAds = inject(ModalAdsService);
  private notificationService = inject(NotificationService);

  show = false;
  leafHidden = false;
  modalOpen = false;
  emailInput = '';

  ngOnInit(): void {
    this.modalAds.show$.subscribe(v => {
      this.show = v;
      if (v) {
        this.leafHidden = false;
        this.modalOpen = false;
      } else {
        this.leafHidden = true;
      }
    });
  }

  closeLeaf() {
    this.leafHidden = true;
    this.modalAds.dismiss();
  }

  openLeafModal() {
    this.leafHidden = true;
    setTimeout(() => {
      this.modalOpen = true;
    }, 300);
  }

  onModalClose() {
    this.modalOpen = false;
    setTimeout(() => {
      this.leafHidden = false;
    }, 50);
  }

  async onSubscribe(email: string) {
    if (!email || !email.trim()) return;
    const res = await this.modalAds.subscribe(email.trim());
    this.modalOpen = false;
    this.leafHidden = true;

    if (res.ok) {
      if (res.alreadySubscribed) {
        this.notificationService.showInfo(
          'Correo ya suscrito',
          'Este correo ya se encuentra suscrito al newsletter. Si tienes una cuenta, puedes gestionarlo desde tu panel de control.'
        );
      } else {
        this.notificationService.showSuccess(
          '¡Suscripción exitosa!',
          'Gracias por suscribirte al newsletter. Revisa tu correo con tu código de descuento.'
        );
      }
    }
  }
}
