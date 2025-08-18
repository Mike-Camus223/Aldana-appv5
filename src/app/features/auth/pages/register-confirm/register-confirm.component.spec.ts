import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import RegisterConfirmComponent from './register-confirm.component';

describe('RegisterConfirmComponent', () => {
  let component: RegisterConfirmComponent;
  let fixture: ComponentFixture<RegisterConfirmComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterConfirmComponent,
        CommonModule,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterConfirmComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display success message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('¡Cuenta Registrada!');
  });

  it('should have a button to go to home', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button');
    expect(button?.textContent?.trim()).toBe('Ir al Inicio');
  });

  it('should navigate to home when button is clicked', () => {
    spyOn(router, 'navigate');
    component.goToHome();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should have a link to login page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const loginLink = compiled.querySelector('a[routerLink="/auth/login"]');
    expect(loginLink).toBeTruthy();
    expect(loginLink?.textContent?.trim()).toBe('Inicia sesión aquí');
  });

  it('should display email confirmation instructions', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const instructions = compiled.textContent;
    expect(instructions).toContain('Revisa tu correo electrónico');
    expect(instructions).toContain('confirmar tu cuenta');
  });
});
