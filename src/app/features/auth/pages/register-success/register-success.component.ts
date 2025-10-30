import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './register-success.component.html',
  styleUrls: ['./register-success.component.css']
})
export class RegisterSuccessComponent implements OnInit {
  
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Verificar si hay parámetros de error en la URL
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        console.log('URL fragment:', fragment);
        // Aquí podrías manejar diferentes casos si es necesario
        // Por ejemplo, si hay errores específicos de Supabase
      }
    });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
