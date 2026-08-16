
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  imports: [],
  templateUrl: './page-not-found.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-not-found.component.css'
})
export class PageNotFoundComponent {

  private router = inject(Router);

  goHome() {
    this.router.navigate(['/']);
  }
}
