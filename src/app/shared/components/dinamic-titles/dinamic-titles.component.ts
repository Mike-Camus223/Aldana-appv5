import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FadeUpLetterDirective } from '../../utils/directives/fadeupletter.directive';

@Component({
  selector: 'app-dinamic-titles',
  standalone: true,
  imports: [CommonModule, FadeUpLetterDirective],
  templateUrl: './dinamic-titles.component.html',
  styleUrls: ['./dinamic-titles.component.css']
})
export class DinamicTitlesComponent {
  @Input() text: string = '';
  @Input() subtitle: string = '';
  @Input() level: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  @Input() isParagraph: boolean = false;
  @Input() backgroundColor: string = '';
  @Input() size: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' = '2xl';
  @Input() weight: 'normal' | 'bold' | 'semibold' | 'medium' | 'light' = 'bold';
  @Input() italic: boolean = false;
  @Input() align: 'start' | 'center' | 'end' = 'start';
  @Input() textColor: string = 'text-gray-900';
  @Input() responsiveClasses: string = '';
  @Input() containerMaxWidth: string = ''; 
  @Input() containerResponsiveClasses: string = ''; 
  @Input() subtitleColor: string = 'text-gray-600';
  @Input() subtitleSize: 'sm' | 'base' | 'lg' = 'base';
  @Input() subtitleResponsiveClasses: string = '';
  @Input() highlightWords: { word: string, classes: string }[] = [];
  @Input() backgroundMarginX: string = ''; 


  get classes(): string {
    const sizeMap = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl'
    };

    const alignMap = {
      start: 'text-left',
      center: 'text-center',
      end: 'text-right'
    };

    const weightMap = {
      normal: 'font-normal',
      bold: 'font-bold',
      semibold: 'font-semibold',
      medium: 'font-medium',
      light: 'font-light'
    };

    return [
      sizeMap[this.size],
      weightMap[this.weight],
      alignMap[this.align],
      this.italic ? 'italic' : '',
      this.textColor,
      this.responsiveClasses
    ].join(' ');
  }

  get subtitleClasses(): string {
    const sizeMap = {
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg'
    };

    const alignMap = {
      start: 'text-left',
      center: 'text-center',
      end: 'text-right'
    };

    return [
      sizeMap[this.subtitleSize],
      alignMap[this.align],
      this.subtitleColor,
      this.subtitleResponsiveClasses
    ].join(' ');
  }

  get parsedText(): string {
    let result = this.text;

    this.highlightWords.forEach(({ word, classes }) => {
      const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
      const regex = new RegExp(`(${safeWord})`, 'gi');
      result = result.replace(regex, `<span class="${classes}">$1</span>`);
    });

    return result;
  }
}
