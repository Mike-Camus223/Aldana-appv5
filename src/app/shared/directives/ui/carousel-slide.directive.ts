import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: '[carouselItem]',
  standalone: true,
})
export class CarouselItemDirective {
  constructor(public templateRef: TemplateRef<unknown>) {}
}