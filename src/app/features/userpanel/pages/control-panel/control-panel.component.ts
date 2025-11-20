import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Heart, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Send, User } from 'lucide-angular';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css'],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Send,
        User,
        Heart
      })
    }
  ]
})
export class ControlPanelComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  user = this.authService.currentUser$;

  Gotofav() {
    this.router.navigate(['/panel/favoritos']);
  }

  GotoAccountInfo() {
    this.router.navigate(['/panel/informacion-cuenta']);
  }
}

// ANTES DE IRTE RECUERDA QUE TENES QUE HACER EL SISTEMA DE WHITELIST 
// CON LA TABLA QUE CREAMOS Y CONECTARLO CON USUARIOS Y EL COMPONENTE DE TIENDA
// OK? 