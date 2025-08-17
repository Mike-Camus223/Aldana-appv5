import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isFirstLoad = true;
  private isMainLoaderComplete = false;
  
  private currentLoaderSubject = new BehaviorSubject<'main' | 'generic' | null>(null);
  public currentLoader$ = this.currentLoaderSubject.asObservable();

  private animationsEnabledSubject = new BehaviorSubject<boolean>(false);
  public animationsEnabled$ = this.animationsEnabledSubject.asObservable();

 
  showLoaderOnNavigation() {
    if (this.isFirstLoad) {
      this.currentLoaderSubject.next('main');
      this.isFirstLoad = false;
    } else {
      this.currentLoaderSubject.next('generic');
    }
  }

  finish(loaderType?: 'main' | 'generic') {
    this.currentLoaderSubject.next(null);

    if (loaderType === 'main') {
      this.isMainLoaderComplete = true;
    }
    
    if (loaderType === 'generic') {
    }

    this.animationsEnabledSubject.next(true);
    ScrollTrigger.refresh();
  }

  refreshScrollTrigger() {
    ScrollTrigger.refresh();
  }

  clearAllAnimations(): void {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  reset() {
    this.currentLoaderSubject.next(null);
    this.isFirstLoad = true;
    this.isMainLoaderComplete = false;
    this.animationsEnabledSubject.next(false);
  }

  canShowGenericLoader(): boolean {
    return this.isMainLoaderComplete;
  }

  setAnimationsEnabled(enabled: boolean): void {
    this.animationsEnabledSubject.next(enabled);
  }
}