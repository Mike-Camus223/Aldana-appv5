import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  TemplateRef,
  ViewChild,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './modal.component.html'
})
export class ModalComponent implements OnChanges, AfterViewInit {
  @ViewChild('dialog') dialog!: Dialog;

  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() maximizable: boolean = false;
  @Input() width: string = '280px';
  @Input() height: string = 'auto';
  @Input() maxWidth: string = '90vw';
  @Input() maxHeight: string = '90vh';
  @Input() breakpoints: { [key: string]: string } = {
    '960px': '90vw',
    '640px': '100vw'
  };
  @Input() contentPadding: string = '0.5rem';
  @Input() header: string = '';
  @Input() forceMaximize: boolean = false;

  @ContentChild('modalContent', { static: false }) modalContent!: TemplateRef<any>;

  maximizeState: boolean = false;
  isMobileScreen: boolean = false;

  constructor(private cd: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.updateMobileState();
  }

  @HostListener('window:resize')
  updateMobileState() {
    this.isMobileScreen = window.innerWidth < 1024;
    this.cd.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.forceMaximize && this.isMobileScreen) {
      this.maximizeState = true;
      this.cd.detectChanges();
    }
  }

  get dialogStyle() {
    if (this.maximizeState) {
      return {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        top: '0',
        left: '0'
      };
    }
    return {
      width: this.width,
      height: this.height,
      maxWidth: this.maxWidth,
      maxHeight: this.maxHeight
    };
  }

  toggleMaximize() {
    this.maximizeState = !this.maximizeState;

    setTimeout(() => {
      if (this.dialog) {
        this.cd.detectChanges();
      }
    }, 0);
  }

  onHide() {
    this.maximizeState = false;
    this.closeModal();
  }

  closeModal() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }
}
