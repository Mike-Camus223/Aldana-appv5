import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tailored',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tailored.component.html',
  styleUrls: ['./tailored.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TailoredComponent {
}
