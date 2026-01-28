import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Modalv2Component } from '../../generic/modalv2/modalv2.component';

@Component({
  selector: 'app-discount-leaf',
  standalone: true,
  imports: [CommonModule, Modalv2Component],
  templateUrl: './discount-leaf.component.html',
  styleUrl: './discount-leaf.component.css'
})
export class DiscountLeafComponent {
 leafHidden = false;
  modalOpen = false;

  closeLeaf() {
    this.leafHidden = true;
  }

  openLeafModal() {
    this.leafHidden = true;

    // esperar animación real
    setTimeout(() => {
      this.modalOpen = true;
    }, 300);
  }

  onModalClose() {
    this.modalOpen = false;

    // vuelve con animación
    setTimeout(() => {
      this.leafHidden = false;
    }, 50);
  }
}
