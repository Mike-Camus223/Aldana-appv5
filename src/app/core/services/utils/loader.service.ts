import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private isFirstLoad = true;
  private isMainLoaderComplete = false;
  // Rutas o patrones donde NO se debe mostrar el loader genérico
  private skipGenericLoaderMatchers: Array<string | RegExp> = [];
  private userPanelRoutes = ['/panel-control', '/favoritos', '/user-panel'];
  private isInUserPanel = false;
  private currentContext: 'public' | 'user-panel' = 'public';
  private isBrowser: boolean;
  
  private currentLoaderSubject = new BehaviorSubject<'main' | 'generic' | null>(null);
  public currentLoader$ = this.currentLoaderSubject.asObservable();

  private animationsEnabledSubject = new BehaviorSubject<boolean>(false);
  public animationsEnabled$ = this.animationsEnabledSubject.asObservable();
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // En SSR, marcar el loader como completado inmediatamente
    if (!this.isBrowser) {
      this.isMainLoaderComplete = true;
      this.isFirstLoad = false;
      this.animationsEnabledSubject.next(true);
    }
  }

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
    // Si es la primera carga
    if (this.isFirstLoad) {
      this.animationsEnabledSubject.next(false);
      this.currentLoaderSubject.next('main');
      this.isFirstLoad = false;
      return;
    }

    // Si es una ruta del panel de usuario
    if (this.isUserPanelRoute(url)) {
      // Solo mostrar loader si venimos desde contexto público
      if (this.currentContext === 'public') {
        this.animationsEnabledSubject.next(false);
        this.currentLoaderSubject.next('generic');
      } else {
        // Si ya estamos en user panel, no mostrar loader
        this.currentLoaderSubject.next(null);
      }
      return;
    }

    // Para otras rutas, verificar si deben omitir el loader genérico
    if (this.shouldSkipGeneric(url)) {
      this.currentLoaderSubject.next(null);
      return;
    }

    // Mostrar loader genérico para otras rutas
    this.animationsEnabledSubject.next(false);
    this.currentLoaderSubject.next('generic');
  }

  finish(loaderType?: 'main' | 'generic') {
    // ORDEN OPTIMIZADO: Primero activar animaciones, luego notificar fin del loader
    this.animationsEnabledSubject.next(true);
    
    this.currentLoaderSubject.next(null);

    if (loaderType === 'main') {
      this.isMainLoaderComplete = true;
    }
    
    // ScrollTrigger refresh más rápido pero seguro
    if (this.isBrowser) {
      setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }, 10); // Reducido de 50ms a 10ms para eliminar delay
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
    if (this.isBrowser) {
      setTimeout(() => {
        this.animationsEnabledSubject.next(true);
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }, 10); // Reducido de 50ms a 10ms
    } else {
      // En SSR, activar animaciones inmediatamente
      this.animationsEnabledSubject.next(true);
    }
  }

  // Método para verificar si estamos en el panel de usuario
  private isUserPanelRoute(url: string): boolean {
    // Verificar rutas directas del navbar y rutas anidadas del user panel
    return url.includes('/favoritos') || 
           url.includes('/panel-control') || 
           url.includes('/user-panel');
  }

  // Método para verificar si estamos navegando dentro del panel de usuario
  private isNavigationWithinUserPanel(previousUrl: string, currentUrl: string): boolean {
    const previousInPanel = this.isUserPanelRoute(previousUrl);
    const currentInPanel = this.isUserPanelRoute(currentUrl);
    return previousInPanel && currentInPanel;
  }

  // Actualizar el estado de navegación dentro del panel de usuario
  public setUserPanelNavigationState(isInUserPanel: boolean): void {
    this.isInUserPanel = isInUserPanel;
  }

  // Método para establecer el contexto actual
  setContext(context: 'public' | 'user-panel'): void {
    this.currentContext = context;
  }
}