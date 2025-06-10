import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, timer, Subscription } from 'rxjs';
import {ToastMessage} from '../../shared/utils/models/toastOptions.model'

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private maxVisible = 4;
  private messages: ToastMessage[] = [];
  private messageTimers = new Map<string, Subscription>();

  private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  constructor(private messageService: MessageService) {}

  private generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  private showToast(message: ToastMessage) {
    this.messageService.add({
      severity: message.severity,
      summary: message.summary,
      detail: message.detail,
      life: message.sticky ? 0 : message.life ?? 3000,
      key: 'main',
      sticky: message.sticky ?? false
    });
  }

  private scheduleRemoval(id: string, life: number) {
    const sub = timer(life).subscribe(() => {
      this.removeMessage(id);
    });
    this.messageTimers.set(id, sub);
  }

  private cancelRemoval(id: string) {
    const sub = this.messageTimers.get(id);
    if (sub) {
      sub.unsubscribe();
      this.messageTimers.delete(id);
    }
  }

  addMessage(message: Omit<ToastMessage, 'id'>) {
    if (this.messages.length >= this.maxVisible) {
      return;
    }

    const id = this.generateId();
    const newMessage: ToastMessage = { id, ...message };
    this.messages.push(newMessage);
    this.messagesSubject.next([...this.messages]);
    this.showToast(newMessage);

    if (!newMessage.sticky) {
      this.scheduleRemoval(id, newMessage.life ?? 3000);
    }
  }

  removeMessage(id: string) {
    this.messages = this.messages.filter(msg => msg.id !== id);
    this.messagesSubject.next([...this.messages]);
    this.cancelRemoval(id);
    this.messageService.clear(id);
  }

  showSuccess(summary: string, detail: string, life?: number, sticky?: boolean) {
    this.addMessage({ severity: 'success', summary, detail, life, sticky });
  }

  showError(summary: string, detail: string, life?: number, sticky?: boolean) {
    this.addMessage({ severity: 'error', summary, detail, life, sticky });
  }

  showWarn(summary: string, detail: string, life?: number, sticky?: boolean) {
    this.addMessage({ severity: 'warn', summary, detail, life, sticky });
  }

  showInfo(summary: string, detail: string, life?: number, sticky?: boolean) {
    this.addMessage({ severity: 'info', summary, detail, life, sticky });
  }
}
