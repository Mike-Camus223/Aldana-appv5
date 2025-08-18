import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import RegisterSuccessComponent from './register-success.component';

describe('RegisterSuccessComponent', () => {
  let component: RegisterSuccessComponent;
  let fixture: ComponentFixture<RegisterSuccessComponent>;
  let router: Router;
  let activatedRoute: ActivatedRoute;

  beforeEach(async () => {
    const activatedRouteStub = {
      fragment: of('access_token=test&type=signup')
    };

    await TestBed.configureTestingModule({
      imports: [
        RegisterSuccessComponent,
        CommonModule,
        RouterTestingModule
      ],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterSuccessComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display success message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('¡Registro Exitoso!');
  });

  it('should have a button to go to home', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('button');
    const homeButton = Array.from(buttons).find(btn => btn.textContent?.trim() === 'Ir al Inicio');
    expect(homeButton).toBeTruthy();
  });

  it('should navigate to home when button is clicked', () => {
    spyOn(router, 'navigate');
    component.goToHome();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should have a login button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const loginButton = compiled.querySelector('button[routerLink="/auth/login"]');
    expect(loginButton).toBeTruthy();
    expect(loginButton?.textContent?.trim()).toBe('Iniciar Sesión');
  });

  it('should display confirmation message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const content = compiled.textContent;
    expect(content).toContain('confirmada exitosamente');
    expect(content).toContain('completamente activa');
  });

  it('should display success icon', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const icon = compiled.querySelector('.fa-check-double');
    expect(icon).toBeTruthy();
  });
});
