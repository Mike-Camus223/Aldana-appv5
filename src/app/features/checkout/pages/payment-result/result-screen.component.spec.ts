import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultScreenComponent } from './result-screen.component';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { CheckoutStepperProgressService } from '../../../../core/services/checkout-stepper-progress.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { of } from 'rxjs';

describe('ResultScreenComponent', () => {
  let component: ResultScreenComponent;
  let fixture: ComponentFixture<ResultScreenComponent>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockOrdersService: any;
  let mockProgressService: any;
  let mockNotificationService: any;
  let mockAuthService: any;
  let mockSupabase: any;

  beforeEach(async () => {
    mockActivatedRoute = {
      queryParams: of({ status: 'approved', orderId: 'order-123' })
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockSupabase = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.resolveTo({
              data: {
                id: 'order-123',
                order_number: 'ORD-001',
                total_final: 5000,
                customer_first_name: 'Aldana',
                customer_last_name: 'Ventas',
                whatsapp_message: 'Mercado Pago - Agencia: SUC_PALERMO'
              },
              error: null
            })
          })
        })
      })
    };

    mockOrdersService = {
      getUserOrders: jasmine.createSpy('getUserOrders').and.resolveTo({ success: true, orders: [] })
    };

    mockProgressService = {
      completeStep: jasmine.createSpy('completeStep')
    };

    mockNotificationService = {
      showError: jasmine.createSpy('showError')
    };

    mockAuthService = {
      getAuthenticatedClient: jasmine.createSpy('getAuthenticatedClient').and.returnValue(mockSupabase)
    };

    await TestBed.configureTestingModule({
      imports: [ResultScreenComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: CheckoutStepperProgressService, useValue: mockProgressService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResultScreenComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch order details on init and complete the checkout step if approved', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockProgressService.completeStep).toHaveBeenCalledWith('pago');
    expect(mockAuthService.getAuthenticatedClient).toHaveBeenCalled();
    expect(component.order).toBeTruthy();
    expect(component.order.order_number).toBe('ORD-001');
    expect(component.isSucursal).toBeTrue();
    expect(component.agencyCode).toBe('SUC_PALERMO');
  });
});
