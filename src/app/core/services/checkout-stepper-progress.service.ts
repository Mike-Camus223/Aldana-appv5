import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CheckoutStepperProgressService {

  private steps = ['carrito', 'envio', 'pago'] as const;
  private progress: Record<string, boolean> = {
    carrito: false,
    envio: false,
    pago: false,
  };

  constructor() {
    this.loadFromStorage();
  }

  completeStep(step: keyof typeof this.progress): void {
    this.progress[step] = true;
    this.saveToStorage();
  }

  isStepComplete(step: keyof typeof this.progress): boolean {
    return this.progress[step];
  }

  canAccessStep(step: typeof this.steps[number]): boolean {
    const index = this.steps.indexOf(step);
    if (index === -1) return false;
    return this.steps.slice(0, index).every((s) => this.progress[s]);
  }

  reset(): void {
    this.progress = {
      carrito: false,
      envio: false,
      pago: false,
    };
    this.saveToStorage();
  }

  private saveToStorage(): void {
    localStorage.setItem('checkoutProgress', JSON.stringify(this.progress));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('checkoutProgress');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object') {
          this.progress = { ...this.progress, ...parsed };
        }
      } catch (_) { }
    }
  }
}
