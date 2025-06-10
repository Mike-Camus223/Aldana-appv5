import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../utils/models/cartItems-model';

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
      transition('* => void', animate('200ms ease-in'))
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
  ]
})
export class NavbarPublicv2Component implements OnInit {
  MoverScroll = false;
  dropdownOpen = false;
  menuOpen = false;
  cartItemCount = 0;
  cartItems: CartItem[] = [];

  tiendaItems = [
    'Camisas',
    'Blusas',
    'Faldas',
    'Pantalón',
    'Abrigos',
    'Vestidos'
  ];

  @ViewChild('dropdownRef') dropdownRef!: ElementRef;

  constructor(private router: Router, private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0); // <- total de productos
    });
  }

  @HostListener('window:scroll')
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
    if (!this.menuOpen) this.dropdownOpen = false;
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

  normalizeCategory(item: string): string {
    return item.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  goToCategory(item: string): void {
    this.closeDropdown();
    this.onMenuLinkClick();
    this.router.navigate(['/tienda'], { queryParams: { categoria: this.normalizeCategory(item) } });
  }
}
