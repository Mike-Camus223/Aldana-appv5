import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { ToastMessage } from '../../../utils/models/toastOptions.model';

@Component({
  selector: 'app-toast-notification',
  imports: [CommonModule],
  templateUrl: './toast-notification.component.html',
  styleUrl: './toast-notification.component.css',
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({
          transform: 'translateX(20px)',
          opacity: 0,
          scale: 0.95
        }),
        animate(
          '250ms cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          style({
            transform: 'translateX(0)',
            opacity: 1,
            scale: 1
          })
        )
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 1, 1)',
          style({
            transform: 'translateX(40px)',
            opacity: 0
          })
        )
      ])
    ])
  ]
})
export class ToastNotificationComponent implements OnInit, OnDestroy {

  messages: ToastMessage[] = [];
  private subscription?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.messages$.subscribe(messages => {
      this.messages = messages.map(msg => ({
        ...msg,
        state: msg.state || 'visible'
      }));
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  getBorderClass(message: ToastMessage): string {
    switch (message.severity) {
      case 'success': return 'border-t-6 border-aldy-medium';
      case 'error':   return 'border-t-6 border-red-400';
      case 'warn':    return 'border-t-6 border-amber-400';
      case 'info':    return 'border-t-6 border-blue-400';
      default:        return 'border-t-6 border-aldy-medium';
    }
  }

  getToastClasses(message: ToastMessage): string {
    const baseClasses =
      'min-w-80 max-w-md bg-aldy-white shadow-lg flex items-start p-4 gap-3 relative overflow-hidden pointer-events-auto';

    const severityClasses = {
      success: 'text-aldy-green-gray',
      error:   'text-aldy-green-gray',
      warn:    'text-aldy-green-gray',
      info:    'text-aldy-green-gray'
    };

    return `${baseClasses} ${severityClasses[message.severity]}`;
  }

  closeToast(id: string) {
    const message = this.messages.find(m => m.id === id);
    if (message) {
      message.state = 'hidden';
      setTimeout(() => this.notificationService.removeMessage(id), 200);
    }
  }

  onAnimationDone(event: any, message: ToastMessage) {
    if (event.toState === 'hidden') {
      this.notificationService.removeMessage(message.id);
    }
  }
}
