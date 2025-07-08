import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.loadingSubject.asObservable();
  private animationsEnabledSubject = new BehaviorSubject<boolean>(false);
  public animationsEnabled$ = this.animationsEnabledSubject.asObservable();

  constructor() {
    ScrollTrigger.disable();
  }

  finish() {
    this.loadingSubject.next(false);
    if (!this.animationsEnabledSubject.value) {
      this.enableAnimations();
    }
  }
  enableAnimationsEarly() {
    this.enableAnimations();
  }

  private enableAnimations() {
    ScrollTrigger.enable();
    ScrollTrigger.refresh();
    this.animationsEnabledSubject.next(true);
  }
  reset() {
    ScrollTrigger.disable();
    this.loadingSubject.next(true);
    this.animationsEnabledSubject.next(false);
  }
}