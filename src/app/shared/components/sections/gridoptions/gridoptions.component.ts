import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-gridoptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gridoptions.component.html',
  styleUrls: ['./gridoptions.component.css']
})
export class GridoptionsComponent {
  products = [
    {
      title: 'EDICIÓN ESCAPADA',
      image: 'https://picsum.photos/id/229/600/600',
      link: '#'
    },
    {
      title: 'CAMISERÍA',
      image: 'https://picsum.photos/id/227/600/600',
      link: '#'
    },
    {
      title: 'VESTIDOS',
      image: 'https://picsum.photos/id/217/600/600',
      link: '#'
    },
    {
      title: 'TIENDA THE LINE',
      image: 'https://picsum.photos/id/437/600/600',
      link: '#'
    }
  ];
}
