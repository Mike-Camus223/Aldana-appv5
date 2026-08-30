import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';

@Component({
  selector: 'app-newsletter',
  imports: [CommonModule, LucideAngularModule, WordRevealDirective, FadeUpLetterDirective, CardInitAnimationDirective],
  templateUrl: './newsletter.component.html', styleUrl: './newsletter.component.css'
})
export class NewsletterComponent {

  async onSubscribe(input: HTMLInputElement) {
    if (!input.checkValidity()) {
      input.reportValidity(); 
      return;
    }
    const email = input.value.trim();
    if (!email) return;

    input.value = '';
  }
}