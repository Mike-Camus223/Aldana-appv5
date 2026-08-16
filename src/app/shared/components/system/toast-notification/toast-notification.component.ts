import {
  Component,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChildren,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';

import { Subscription } from 'rxjs';
import gsap from 'gsap';
import { NotificationService } from '../../../../core/services/notification.service';
import { ToastMessage } from '../../../utils/models/toastOptions.model';

@Component({
  selector: 'app-toast-notification',
  imports: [],
  templateUrl: './toast-notification.component.html'
})
export class ToastNotificationComponent implements OnInit, OnDestroy {

  messages: ToastMessage[] = [];
  private subscription?: Subscription;
  private animatedIds = new Set<string>();
  private leavingIds = new Set<string>();

  @ViewChildren('toastEl') toastElements!: QueryList<ElementRef<HTMLElement>>;

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.notificationService.messages$.subscribe(messages => {
      const incomingIds = new Set(messages.map(m => m.id));

      // IDs que estaban antes y ya no están en el nuevo array = el servicio los removió
      const removedIds = this.messages
        .map(m => m.id)
        .filter(id => !incomingIds.has(id) && !this.leavingIds.has(id));

      if (removedIds.length > 0) {
        // Animamos salida de cada uno con stagger, y recién después actualizamos la lista
        this.animateOutBatch(removedIds, () => {
          this.messages = this.messages.filter(m => incomingIds.has(m.id));
          this.cdr.detectChanges();
        });
      } else {
        // Solo entradas nuevas
        this.messages = messages;
        this.cdr.detectChanges();

        this.toastElements.forEach(ref => {
          const el = ref.nativeElement;
          const id = el.getAttribute('data-id')!;
          if (!this.animatedIds.has(id) && !this.leavingIds.has(id)) {
            this.animatedIds.add(id);
            this.animateIn(el);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private getEl(id: string): HTMLElement | null {
    const ref = this.toastElements?.find(
      r => r.nativeElement.getAttribute('data-id') === id
    );
    return ref?.nativeElement ?? null;
  }

  private animateIn(el: HTMLElement) {
    const shimmer = el.lastElementChild as HTMLElement;

    gsap.set(el, { x: 60, opacity: 0, clipPath: 'inset(0 0 100% 0)', filter: 'blur(4px)' });

    gsap.timeline()
      .to(el, { clipPath: 'inset(0 0 0% 0)', duration: 0.32, ease: 'power3.out' })
      .to(el, { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.42, ease: 'expo.out' }, '-=0.18')
      .fromTo(shimmer,
        { background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', backgroundSize: '200% 100%', backgroundPositionX: '-100%', opacity: 1 },
        { backgroundPositionX: '200%', opacity: 0, duration: 0.65, ease: 'power1.inOut' },
        '-=0.3'
      );
  }

  private animateOut(el: HTMLElement, onComplete?: () => void) {
    gsap.killTweensOf(el);
    const currentHeight = el.offsetHeight;
    gsap.set(el, { height: currentHeight, overflow: 'hidden' });

    gsap.timeline({ onComplete })
      .to(el, { x: 12, duration: 0.08, ease: 'power2.out' })
      .to(el, { x: 110, opacity: 0, filter: 'blur(6px)', duration: 0.32, ease: 'expo.in' })
      .to(el, { height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0, duration: 0.22, ease: 'power3.inOut' }, '-=0.06');
  }

  private animateOutBatch(ids: string[], onAllDone: () => void) {
    ids.forEach(id => this.leavingIds.add(id));

    let completed = 0;

    ids.forEach((id, i) => {
      const el = this.getEl(id);
      if (!el) {
        completed++;
        if (completed === ids.length) onAllDone();
        return;
      }

      // Stagger escalonado: cada toast sale 80ms después del anterior
      setTimeout(() => {
        this.animateOut(el, () => {
          completed++;
          this.leavingIds.delete(id);
          this.animatedIds.delete(id);
          if (completed === ids.length) onAllDone();
        });
      }, i * 80);
    });
  }

  closeToast(id: string) {
    if (this.leavingIds.has(id)) return;

    const el = this.getEl(id);
    if (!el) {
      this.notificationService.removeMessage(id);
      return;
    }

    this.leavingIds.add(id);

    this.animateOut(el, () => {
      this.leavingIds.delete(id);
      this.animatedIds.delete(id);
      this.notificationService.removeMessage(id);
    });
  }

  getBorderClass(message: ToastMessage): string {
    const map: Record<string, string> = {
      success: 'border-aldy-medium',
      error:   'border-red-400',
      warn:    'border-amber-400',
      info:    'border-blue-400'
    };
    return map[message.severity] ?? 'border-aldy-medium';
  }

  getToastClasses(message: ToastMessage): string {
    return [
      'min-w-80 max-w-md',
      'bg-aldy-white shadow-lg',
      'flex items-start p-4 gap-3',
      'text-aldy-green-gray',
      this.getBorderClass(message)
    ].join(' ');
  }
}