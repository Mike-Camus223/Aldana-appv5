import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'app-navbar-publicv2',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar-publicv2.component.html',
  styleUrls: ['./navbar-publicv2.component.css'],
  animations: [
    trigger('dropdownAnimation', [
      state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => *', animate('250ms ease-out')),
      transition('* => void', animate('200ms ease-in')),
    ]),
    trigger('expandCollapse', [
      state('void', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('void <=> *', animate('300ms ease'))
    ]),
    trigger('expandDropdown', [
      state('void', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      transition('void <=> *', animate('250ms ease'))
    ])
  ],
})
export class NavbarPublicv2Component {
  MoverScroll = false;
  dropdownOpen = false;
  menuOpen = false;
  cartItemCount = 1;

  tiendaItems = [
    'Camisas y Blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos'
  ];

  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.MoverScroll = window.scrollY > 10;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.dropdownOpen && this.dropdownRef && !this.dropdownRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) {
      this.dropdownOpen = false;
    }
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown() {
    this.dropdownOpen = false;
  }

  onMenuLinkClick() {
    this.menuOpen = false;
    this.dropdownOpen = false;
  }

  // Función para normalizar y preparar la categoría para queryParams
  normalizeCategory(item: string): string {
    return item
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // quitar tildes
      .toLowerCase()
      .replace(/\s+/g, '-');            // espacios por guiones
  }
}
