// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { CookieService } from 'ngx-cookie-service';

// @Injectable({
//   providedIn: 'root'
// })
// export class CookiesService {
//   private memory = new Map<string, string>();
//   private isBrowser: boolean;

//   constructor(
//     @Inject(PLATFORM_ID) platformId: Object,
//     private cookies: CookieService
//   ) {
//     this.isBrowser = isPlatformBrowser(platformId);
//   }

//   get(key: string): string {
//     if (this.isBrowser) {
//       return this.cookies.get(key) || '';
//     }
//     return this.memory.get(key) || '';
//   }

//   setDays(key: string, value: string, days: number, path: string = '/'): void {
//     if (this.isBrowser) {
//       this.cookies.set(key, value, days, path);
//       return;
//     }
//     this.memory.set(key, value);
//   }

//   setHours(key: string, value: string, hours: number, path: string = '/'): void {
//     const expires = new Date(Date.now() + hours * 60 * 60 * 1000);
//     if (this.isBrowser) {
//       this.cookies.set(key, value, expires, path);
//       return;
//     }
//     this.memory.set(key, value);
//   }

//   delete(key: string, path: string = '/'): void {
//     if (this.isBrowser) {
//       this.cookies.delete(key, path);
//       return;
//     }
//     this.memory.delete(key);
//   }
// }

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class CookiesService {
  private memory = new Map<string, string>();
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private cookies: CookieService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get(key: string): string {
    if (this.isBrowser) {
      return this.cookies.get(key) || '';
    }
    return this.memory.get(key) || '';
  }

  setDays(key: string, value: string, days: number, path: string = '/'): void {
    if (this.isBrowser) {
      this.cookies.set(key, value, days, path);
      return;
    }
    this.memory.set(key, value);
  }

  setHours(key: string, value: string, hours: number, path: string = '/'): void {
    const expires = new Date(Date.now() + hours * 60 * 60 * 1000);
    if (this.isBrowser) {
      this.cookies.set(key, value, expires, path);
      return;
    }
    this.memory.set(key, value);
  }

  delete(key: string, path: string = '/'): void {
    if (this.isBrowser) {
      this.cookies.delete(key, path);
      return;
    }
    this.memory.delete(key);
  }
}
