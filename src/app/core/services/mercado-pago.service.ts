import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MercadoPagoService {
  private mp: any;

  async init(publicKey: string): Promise<any> {
    if (typeof (window as any).MercadoPago === 'undefined') {
      await this.waitForMPToLoad();
    }

    this.mp = new (window as any).MercadoPago(publicKey, { locale: 'es-AR' });
    return this.mp;
  }

  private waitForMPToLoad(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (typeof (window as any).MercadoPago !== 'undefined') {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  getMP(): any {
    return this.mp;
  }
}
