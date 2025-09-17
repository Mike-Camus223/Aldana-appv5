import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RedirectGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      // User is authenticated, redirect immediately
      if (this.authService.isAdmin()) {
        return of(this.router.createUrlTree(['/dashboard']));
      } else {
        return of(this.router.createUrlTree(['/panel-control']));
      }
    }
    return of(true);
  }
}
