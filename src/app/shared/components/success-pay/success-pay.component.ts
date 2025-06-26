import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CheckoutStepperProgressService } from '../../../core/services/checkout-stepper-progress.service';

@Component({
  selector: 'app-success-pay',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './success-pay.component.html',
  styleUrls: ['./success-pay.component.css']
})
export class SuccessPayComponent implements OnInit {
  constructor(private progress: CheckoutStepperProgressService) {}

  ngOnInit(): void {
    this.progress.completeStep('pago');
  }
}
