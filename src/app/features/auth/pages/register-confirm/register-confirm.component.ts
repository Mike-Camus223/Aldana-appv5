import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-register-confirm',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-confirm.component.html',
  styleUrls: ['./register-confirm.component.css']
})
export default class RegisterConfirmComponent {
  
  constructor(private router: Router) {}

  goToHome() {
    this.router.navigate(['/home']);
  }
}
