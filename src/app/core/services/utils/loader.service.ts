import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  public isFirstLoad = true;
  private isMainLoaderComplete = false;
  private skipGenericLoaderMatchers: Array<string | RegExp> = [];
  private isBrowser: boolean;
  private isNavigationSkipped = false;
  
  // Track the active loader component
  private currentLoaderSubject = new BehaviorSubject<'main' | 'generic' | null>('main');
  public currentLoader$ = this.currentLoaderSubject.asObservable();

  // Signal indicating when GSAP animations can start
  private animationsEnabledSubject = new BehaviorSubject<boolean>(false);
  public animationsEnabled$ = this.animationsEnabledSubject.asObservable();

  // Track navigation state for the generic loader transition
  private navigationStateSubject = new BehaviorSubject<'start' | 'end' | null>(null);
  public navigationState$ = this.navigationStateSubject.asObservable();
  
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.initRouterListener();
    } else {
      // In SSR, mark everything complete immediately
      this.isMainLoaderComplete = true;
      this.isFirstLoad = false;
      this.animationsEnabledSubject.next(true);
      this.currentLoaderSubject.next(null);
    }
  }

  private initRouterListener(): void {
    let lastUrl = '';

    this.router.events.pipe(
      filter(event => 
        event instanceof NavigationStart || 
        event instanceof NavigationEnd || 
        event instanceof NavigationCancel || 
        event instanceof NavigationError
      )
    ).subscribe(event => {
      if (event instanceof NavigationStart) {
        // Compare base paths (ignoring query params/hash)
        const currentUrl = lastUrl.split('?')[0].split('#')[0];
        const targetUrl = event.url.split('?')[0].split('#')[0];
        
        if (currentUrl === targetUrl && lastUrl !== '') {
          return;
        }

        // Check if this route should skip the generic loader
        if (!this.isFirstLoad && this.shouldSkipGeneric(event.url)) {
          this.isNavigationSkipped = true;
          this.animationsEnabledSubject.next(false);
          this.currentLoaderSubject.next(null);
          return;
        }

        this.isNavigationSkipped = false;

        if (this.isFirstLoad) {
          this.animationsEnabledSubject.next(false);
          this.currentLoaderSubject.next('main');
        } else {
          this.animationsEnabledSubject.next(false);
          this.currentLoaderSubject.next('generic');
          this.navigationStateSubject.next('start');
        }
      } else {
        // NavigationEnd, NavigationCancel, NavigationError
        const url = (event as any).url || '';
        lastUrl = url;

        if (this.isNavigationSkipped) {
          // If we skipped the loader, trigger animations immediately after navigation ends
          this.animationsEnabledSubject.next(true);
          this.currentLoaderSubject.next(null);
          this.isNavigationSkipped = false;
          
          if (this.isBrowser) {
            setTimeout(() => {
              if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
              }
            }, 10);
          }
        } else if (!this.isFirstLoad) {
          // Tell the generic loader to play its exit animation
          this.navigationStateSubject.next('end');
        }
      }
    });
  }

  finish(loaderType?: 'main' | 'generic') {
    this.animationsEnabledSubject.next(true);
    this.currentLoaderSubject.next(null);
    this.navigationStateSubject.next(null);

    if (loaderType === 'main') {
      this.isFirstLoad = false;
      this.isMainLoaderComplete = true;
    }
    
    if (this.isBrowser) {
      setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }, 10);
    }
  }

  refreshScrollTrigger() {
    if (this.isBrowser && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  clearAllAnimations(): void {
    if (this.isBrowser && typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    }
  }

  reset() {
    this.currentLoaderSubject.next(null);
    this.navigationStateSubject.next(null);
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

  setSkipGenericLoaderMatchers(matchers: (string | RegExp)[]) {
    this.skipGenericLoaderMatchers = matchers;
  }

  addSkipGenericLoaderMatcher(matcher: string | RegExp) {
    this.skipGenericLoaderMatchers.push(matcher);
  }

  private shouldSkipGeneric(url: string): boolean {
    return this.skipGenericLoaderMatchers.some(m =>
      typeof m === 'string' ? url.startsWith(m) : (m as RegExp).test(url)
    );
  }

  // Force animations trigger (for skipped pages if needed)
  triggerAnimations() {
    this.animationsEnabledSubject.next(false);
    if (this.isBrowser) {
      setTimeout(() => {
        this.animationsEnabledSubject.next(true);
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }, 10);
    } else {
      this.animationsEnabledSubject.next(true);
    }
  }

  // Backward compatibility compatibility layer (deprecated/no-op)
  showLoaderOnNavigation() {}
  showLoaderOnNavigationIfAllowed(url: string) {}
  setUserPanelNavigationState(isInUserPanel: boolean) {}
  setContext(context: 'public' | 'user-panel') {}
  pageReady() {}
}