// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';
// import { isPlatformBrowser } from '@angular/common';
// import { CookiesService } from './cookies.service';
// import { SupabaseService } from './data-access/supabase.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class ModalAdsService {
//   private showSubject = new BehaviorSubject<boolean>(false);
//   show$ = this.showSubject.asObservable();
//   private isBrowser: boolean;

//   private readonly SUBSCRIBED_KEY = 'promo_subscribed';
//   private readonly DISMISS_UNTIL_KEY = 'promo_dismiss_until';

//   constructor(
//     @Inject(PLATFORM_ID) platformId: Object,
//     private cookies: CookiesService,
//     private supabase: SupabaseService
//   ) {
//     this.isBrowser = isPlatformBrowser(platformId);
//     this.initializeState();
//   }

//   private initializeState(): void {
//     const subscribed = this.cookies.get(this.SUBSCRIBED_KEY) === '1';
//     const dismissUntilStr = this.cookies.get(this.DISMISS_UNTIL_KEY);
//     const now = Date.now();
//     const dismissUntil = dismissUntilStr ? parseInt(dismissUntilStr, 10) : 0;
//     const shouldShow = !subscribed && now >= dismissUntil;
//     this.showSubject.next(shouldShow);
//   }

//   dismiss(): void {
//     const nextTime = Date.now() + 2 * 60 * 60 * 1000;
//     this.cookies.setHours(this.DISMISS_UNTIL_KEY, String(nextTime), 2);
//     this.showSubject.next(false);
//   }

//   async subscribe(email: string): Promise<{ ok: boolean; error?: string }> {
//     try {
//       const origin = this.isBrowser ? window.location.pathname : 'ssr';
//       const { data, error } = await this.supabaseSubscribe(email, origin);
//       this.cookies.setDays(this.SUBSCRIBED_KEY, '1', 365);
//       this.showSubject.next(false);
//       if (error) {
//         return { ok: true, error: 'registrado localmente' };
//       }
//       return { ok: true };
//     } catch (e) {
//       this.cookies.setDays(this.SUBSCRIBED_KEY, '1', 365);
//       this.showSubject.next(false);
//       return { ok: true, error: 'offline' };
//     }
//   }

//   private supabaseSubscribe(email: string, origin: string) {
//     return this.supabase.subscribeEmail(email, origin);
//   }
// }

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { CookiesService } from './cookies.service';
import { SupabaseService } from './data-access/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ModalAdsService {
  private showSubject = new BehaviorSubject<boolean>(false);
  show$ = this.showSubject.asObservable();
  private isBrowser: boolean;
  private timerId: any = null;
  private dismissUntilMem = 0;

  private readonly SUBSCRIBED_KEY = 'promo_subscribed';
  private readonly DISMISS_UNTIL_KEY = 'promo_dismiss_until';

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cookies: CookiesService,
    private supabase: SupabaseService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.initializeState();
  }

  private getDismissUntil(): number {
    if (!this.isBrowser) return this.dismissUntilMem;
    try {
      const v = localStorage.getItem(this.DISMISS_UNTIL_KEY);
      return v ? parseInt(v, 10) : 0;
    } catch {
      return 0;
    }
  }

  private setDismissUntil(value: number): void {
    if (!this.isBrowser) {
      this.dismissUntilMem = value;
      return;
    }
    try {
      localStorage.setItem(this.DISMISS_UNTIL_KEY, String(value));
    } catch {}
  }

  private initializeState(): void {
    const subscribed = this.cookies.get(this.SUBSCRIBED_KEY) === '1';
    const dismissUntil = this.getDismissUntil();
    const now = Date.now();
    const shouldShow = !subscribed && now >= dismissUntil;
    this.showSubject.next(shouldShow);
    if (!shouldShow && !subscribed && dismissUntil > now) {
      this.scheduleNextCheck(dismissUntil);
    } else {
      this.clearTimer();
    }
  }

  dismiss(): void {
    const nextTime = Date.now() + 5 * 60 * 1000;
    this.setDismissUntil(nextTime);
    this.showSubject.next(false);
    this.scheduleNextCheck(nextTime);
  }

  async subscribe(email: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const origin = this.isBrowser ? window.location.pathname : 'ssr';
      const { data, error } = await this.supabaseSubscribe(email, origin);
      this.cookies.setDays(this.SUBSCRIBED_KEY, '1', 365);
      this.showSubject.next(false);
      this.clearTimer();
      return { ok: true, error: error ? 'registrado localmente' : undefined };
    } catch {
      this.cookies.setDays(this.SUBSCRIBED_KEY, '1', 365);
      this.showSubject.next(false);
      this.clearTimer();
      return { ok: true, error: 'offline' };
    }
  }

  private supabaseSubscribe(email: string, origin: string) {
    return this.supabase.subscribeEmail(email, origin);
  }

  private scheduleNextCheck(dismissUntil: number) {
    if (!this.isBrowser) return;
    this.clearTimer();
    const delay = Math.max(dismissUntil - Date.now(), 0);
    this.timerId = setTimeout(() => {
      this.initializeState();
    }, delay);
  }

  private clearTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
