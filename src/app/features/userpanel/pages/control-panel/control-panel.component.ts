import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Heart, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Mail, MessageCircle, Send, ShoppingBag, User, UserRound } from 'lucide-angular';

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
        Mail
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
