import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Send } from 'lucide-angular';
import { CardInitAnimationDirective } from '../../../utils/directives/card-init-animation.directive';
import { WordRevealDirective } from '../../../utils/directives/word-reveal.directive';
import { FadeUpLetterDirective } from '../../../utils/directives/fadeupletter.directive';

@Component({
  selector: 'app-newsletter',
  imports: [CommonModule, LucideAngularModule,WordRevealDirective,FadeUpLetterDirective,  ReactiveFormsModule, FormsModule,CardInitAnimationDirective],
  templateUrl: './newsletter.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Send
      })
    }
  ],
  styleUrl: './newsletter.component.css'
})
export class NewsletterComponent {
  readonly form: FormGroup;
  submitted = false;
  success = false;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.email]]
    });
  }

  get email() {
    return this.form.get('email');
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.form.valid) {
      this.success = true;
      console.log('Email enviado:', this.email?.value);

      this.form.reset();
      setTimeout(() => (this.success = false), 3000);
    }
  }
}