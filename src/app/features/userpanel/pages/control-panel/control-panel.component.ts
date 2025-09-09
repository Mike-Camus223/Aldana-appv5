import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Heart, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Send, User } from 'lucide-angular';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, RouterModule,LucideAngularModule],
  templateUrl: './control-panel.component.html',
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
    ],
  
  styleUrl: './control-panel.component.css',
})
export class ControlPanelComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser$;
}