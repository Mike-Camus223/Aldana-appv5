import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isFirstLoad = true;
  private isMainLoaderComplete = false;
  // Rutas o patrones donde NO se debe mostrar el loader genérico
  private skipGenericLoaderMatchers: Array<string | RegExp> = [];
  
  private currentLoaderSubject = new BehaviorSubject<'main' | 'generic' | null>(null);
  public currentLoader$ = this.currentLoaderSubject.asObservable();

  private animationsEnabledSubject = new BehaviorSubject<boolean>(false);
  public animationsEnabled$ = this.animationsEnabledSubject.asObservable();

 
  showLoaderOnNavigation() {
    if (this.isFirstLoad) {
      this.animationsEnabledSubject.next(false);
      this.currentLoaderSubject.next('main');
      this.isFirstLoad = false;
    } else {
      this.animationsEnabledSubject.next(false);
      this.currentLoaderSubject.next('generic');
    }
  }

  // Muestra loader respetando exclusiones configuradas
  showLoaderOnNavigationIfAllowed(url: string) {
    if (this.isFirstLoad) {
      this.animationsEnabledSubject.next(false);
      this.currentLoaderSubject.next('main');
      this.isFirstLoad = false;
      return;
    }

    if (!this.isMainLoaderComplete) return;
    if (this.shouldSkipGeneric(url)) return;

    this.animationsEnabledSubject.next(false);
    this.currentLoaderSubject.next('generic');
  }

  finish(loaderType?: 'main' | 'generic') {
    this.currentLoaderSubject.next(null);

    if (loaderType === 'main') {
      this.isMainLoaderComplete = true;
    }
    
    if (loaderType === 'generic') {
    }
    
    setTimeout(() => {
      this.animationsEnabledSubject.next(true);
      ScrollTrigger.refresh();
    }, 50);
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

  // Configura listado completo de rutas/patrones a omitir
  setSkipGenericLoaderMatchers(matchers: (string | RegExp)[]) {
    this.skipGenericLoaderMatchers = matchers;
  }

  // Agrega una ruta/patrón a omitir
  addSkipGenericLoaderMatcher(matcher: string | RegExp) {
    this.skipGenericLoaderMatchers.push(matcher);
  }

  private shouldSkipGeneric(url: string): boolean {
    return this.skipGenericLoaderMatchers.some(m =>
      typeof m === 'string' ? url.startsWith(m) : (m as RegExp).test(url)
    );
  }

  // Fuerza el reinicio de las animaciones en rutas sin loader
  triggerAnimations() {
    this.animationsEnabledSubject.next(false);
    setTimeout(() => {
      this.animationsEnabledSubject.next(true);
      ScrollTrigger.refresh();
    }, 50); // Pequeño delay para que las directivas procesen el 'false'
  }
}