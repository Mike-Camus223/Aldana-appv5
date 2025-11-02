import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConfirmationGuard } from '../../../../core/guards/confirmation.guard';

@Component({
  selector: 'app-register-confirm',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-confirm.component.html',
  styleUrls: ['./register-confirm.component.css']
})
export class RegisterConfirmComponent {
  
  constructor(private router: Router) {}

  goToHome() {
    // Limpiar el estado de confirmación antes de navegar
    ConfirmationGuard.clearConfirmationState();
    this.router.navigate(['/home']);
  }
}
