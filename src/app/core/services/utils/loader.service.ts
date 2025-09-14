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
  private userPanelRoutes = ['/panel-control', '/favoritos', '/user-panel'];
  private isInUserPanel = false;
  private currentContext: 'public' | 'user-panel' = 'public';
  
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
    console.log('🔄 LoaderService - URL:', url);
    console.log('🔄 LoaderService - Context:', this.currentContext);
    console.log('🔄 LoaderService - isFirstLoad:', this.isFirstLoad);
    console.log('🔄 LoaderService - isUserPanelRoute:', this.isUserPanelRoute(url));

    // Si es la primera carga
    if (this.isFirstLoad) {
      console.log('🔄 LoaderService - Showing MAIN loader');
      this.animationsEnabledSubject.next(false);
      this.currentLoaderSubject.next('main');
      this.isFirstLoad = false;
      return;
    }

    // Si es una ruta del panel de usuario
    if (this.isUserPanelRoute(url)) {
      console.log('🔄 LoaderService - User panel route detected');
      // Solo mostrar loader si venimos desde contexto público
      if (this.currentContext === 'public') {
        console.log('🔄 LoaderService - Showing GENERIC loader (from public context)');
        this.animationsEnabledSubject.next(false);
        this.currentLoaderSubject.next('generic');
      } else {
        console.log('🔄 LoaderService - NOT showing loader (already in user panel)');
        // Si ya estamos en user panel, no mostrar loader
        this.currentLoaderSubject.next(null);
      }
      return;
    }

    // Para otras rutas, verificar si deben omitir el loader genérico
    if (this.shouldSkipGeneric(url)) {
      console.log('🔄 LoaderService - Skipping generic loader');
      this.currentLoaderSubject.next(null);
      return;
    }

    // Mostrar loader genérico para otras rutas
    console.log('🔄 LoaderService - Showing GENERIC loader (normal route)');
    this.animationsEnabledSubject.next(false);
    this.currentLoaderSubject.next('generic');
  }

  finish(loaderType?: 'main' | 'generic') {
    console.log('🔄 LoaderService - finish() called with type:', loaderType);
    
    this.currentLoaderSubject.next(null);

    if (loaderType === 'main') {
      this.isMainLoaderComplete = true;
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