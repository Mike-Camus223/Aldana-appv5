import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-testimonials',
  templateUrl: './testimonials.component.html',
  standalone: true,
  imports: [CommonModule, CarouselModule, RatingModule,FormsModule],
  styleUrls: ['./testimonials.component.css']
})
export class TestimonialsComponent {
  testimonios = [
    {
      nombre: 'Emily Johnson',
      ocupacion: 'Cliente, N/A',
      mensaje: `Los vestidos de Aldana Vilcabana transformaron mi guardarropa. ¡La calidad es excepcional y siempre recibo cumplidos! Altamente recomendable para quienes buscan elegancia y estilo.`,
      foto: 'https://picsum.photos/id/217/600/600',
      valoracion: 5
    },
    {
      nombre: 'Carlos Méndez',
      ocupacion: 'Empresario',
      mensaje: `Increíble atención al detalle y materiales de alta calidad. Cada prenda que compro supera mis expectativas.`,
      foto: 'https://picsum.photos/id/218/600/600',
      valoracion: 5
    },
    {
      nombre: 'Lucía Torres',
      ocupacion: 'Diseñadora Gráfica',
      mensaje: `Me encanta el diseño de cada pieza. Siempre hay algo único y diferente. ¡Gracias Aldana!`,
      foto: 'https://picsum.photos/id/219/600/600',
      valoracion: 5
    },
    {
      nombre: 'Marcos Díaz',
      ocupacion: 'Fotógrafo',
      mensaje: `He comprado varios outfits para sesiones y siempre lucen espectaculares. 100% recomendado.`,
      foto: 'https://picsum.photos/id/220/600/600',
      valoracion: 5
    }
  ];

  responsiveOptions = [
    { breakpoint: '1400px', numVisible: 3, numScroll: 1 },
    { breakpoint: '960px', numVisible: 2, numScroll: 1 },
    { breakpoint: '600px', numVisible: 1, numScroll: 1 }
  ];
}
