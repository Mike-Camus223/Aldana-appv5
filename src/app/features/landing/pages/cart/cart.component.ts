import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CarComponent } from '../../../../shared/components/car/car.component';

@Component({
  selector: 'app-cart',
  imports: [CommonModule,RouterModule,CarComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {

}
