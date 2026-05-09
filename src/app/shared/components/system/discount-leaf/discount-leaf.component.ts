import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ModalComponent} from '../../generic/modal/modal.component';
import { ModalAdsService } from '../../../../core/services/modal-ads.service';

@Component({
  selector: 'app-discount-leaf',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './discount-leaf.component.html',
  styleUrl: './discount-leaf.component.css'
})
export class DiscountLeafComponent implements OnInit {
  show = false;
  leafHidden = false;
  modalOpen = false;
  emailInput = '';

  constructor(private modalAds: ModalAdsService) {}

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
    const res = await this.modalAds.subscribe(email);
    this.modalOpen = false;
    this.leafHidden = true;
  }
}
