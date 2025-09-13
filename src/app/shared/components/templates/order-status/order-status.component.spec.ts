import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OrderStatusComponent } from './order-status.component';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Order } from '../../../../shared/utils/models/order.interface';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Check, NotepadText, BookCheck, Package, Truck, House, Headset, ArrowDownToLine, LucideIconProvider, LUCIDE_ICONS } from 'lucide-angular';

const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: '1',
  order_number: 'ORD-123',
  customer_first_name: 'Test',
  customer_last_name: 'User',
  customer_email: 'test@example.com',
  customer_phone: '123456789',
  address_street: '123 Test St',
  address_number: '123',
  address_apartment: 'Apt 4B',
  city: 'Test City',
  province: 'Test Province',
  postal_code: '1234',
  status: 'pending',
  source_channel: 'web',
  created_at: new Date('2025-01-01T12:00:00Z').toISOString(),
  updated_at: new Date('2025-01-01T12:00:00Z').toISOString(),
  total_final: 15000,
  subtotal: 15000,
  products: [{
    id: 'prod-1',
    name: 'Producto 1',
    price: 5000,
    quantity: 3,
    image: 'image1.jpg',
    color: 'Rojo',
    size: 'XL'
  }],
  user_id: 'user-123',
  wamid: 'tracking-123',
  ...overrides
});

describe('OrderStatusComponent', () => {
  let component: OrderStatusComponent;
  let fixture: ComponentFixture<OrderStatusComponent>;
  let mockOrdersService: jasmine.SpyObj<OrdersService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  const mockOrderPending = createMockOrder({ status: 'pending' });
  const mockOrderInTransit = createMockOrder({ status: 'in_transit', updated_at: new Date('2025-01-01T13:00:00Z').toISOString() });
  const mockOrderCompleted = createMockOrder({ status: 'completed', updated_at: new Date('2025-01-02T14:00:00Z').toISOString() });
  const mockOrderRejected = createMockOrder({ status: 'rejected', updated_at: new Date('2025-01-01T12:30:00Z').toISOString() });

  beforeEach(async () => {
    mockOrdersService = jasmine.createSpyObj('OrdersService', ['getUserOrderById']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    mockActivatedRoute = {
      snapshot: { paramMap: convertToParamMap({ id: '1' }) },
      paramMap: of(convertToParamMap({ id: '1' }))
    };

    await TestBed.configureTestingModule({
      imports: [CommonModule, LucideAngularModule, OrderStatusComponent],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: LUCIDE_ICONS,
          multi: true,
          useValue: new LucideIconProvider({ Check, NotepadText, BookCheck, Package, Truck, House, Headset, ArrowDownToLine })
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderStatusComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carga de Datos (ngOnInit)', () => {
    it('debería cargar los detalles de una orden pendiente al iniciar', fakeAsync(() => {
      mockOrdersService.getUserOrderById.and.returnValue(Promise.resolve({ success: true, order: mockOrderPending }));
      
      fixture.detectChanges(); 
      tick(); 
      fixture.detectChanges();

      expect(mockOrdersService.getUserOrderById).toHaveBeenCalledWith('1');
      expect(component.order).toEqual(mockOrderPending);
      expect(component.loading).toBeFalse();
      expect(component.error).toBeNull();
      expect(fixture.nativeElement.querySelector('h2').textContent).toContain('#ORD-123');
    }));

    it('debería manejar el error si el servicio falla', fakeAsync(() => {
      mockOrdersService.getUserOrderById.and.returnValue(Promise.resolve({ success: false, error: 'Orden no encontrada' }));
      
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.order).toBeNull();
      expect(component.loading).toBeFalse();
      expect(component.error).toBe('Orden no encontrada');
      expect(fixture.nativeElement.querySelector('.text-red-700').textContent).toContain('Orden no encontrada');
    }));

    it('debería manejar un error inesperado de la red', fakeAsync(() => {
        mockOrdersService.getUserOrderById.and.returnValue(Promise.reject('Error de red'));
        
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
  
        expect(component.order).toBeNull();
        expect(component.loading).toBeFalse();
        expect(component.error).toBe('Error inesperado al cargar la orden');
    }));
  });

  describe('Lógica de Estados y Pasos (updateSteps)', () => {
    it('debería mostrar solo un paso para una orden pendiente', () => {
      component.order = mockOrderPending;
      component['updateSteps'](); 
      
      expect(component.steps.length).toBe(1);
      expect(component.steps[0].label).toBe('Pedido realizado');
      expect(component.steps[0].completed).toBeTrue();
    });

    it('debería mostrar 4 pasos para una orden en tránsito, con los 3 primeros completados', () => {
      component.order = mockOrderInTransit;
      component['updateSteps']();
      
      expect(component.steps.length).toBe(4);
      expect(component.steps[0].completed).toBeTrue();
      expect(component.steps[1].completed).toBeTrue();
      expect(component.steps[2].completed).toBeTrue();
      expect(component.steps[2].active).toBeTrue();
      expect(component.steps[3].completed).toBeFalse();
    });

    it('debería mostrar 4 pasos, todos completados, para una orden completada', () => {
      component.order = mockOrderCompleted;
      component['updateSteps']();
      
      expect(component.steps.length).toBe(4);
      component.steps.forEach(step => expect(step.completed).toBeTrue());
    });

    it('debería mostrar solo un paso para una orden rechazada', () => {
      component.order = mockOrderRejected;
      component['updateSteps']();
      
      expect(component.steps.length).toBe(1);
      expect(component.steps[0].label).toBe('Pedido realizado');
      expect(component.steps[0].completed).toBeTrue();
    });
  });

  describe('Interacción con el Template', () => {
    it('debería mostrar el estado de carga inicial', () => {
      component.loading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.animate-spin')).toBeTruthy();
    });

    it('debería mostrar el mensaje de estado pendiente', fakeAsync(() => {
        mockOrdersService.getUserOrderById.and.returnValue(Promise.resolve({ success: true, order: mockOrderPending }));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        const pendingMessage = fixture.nativeElement.querySelector('.bg-yellow-50');
        expect(pendingMessage).toBeTruthy();
        expect(pendingMessage.textContent).toContain('Tu pedido está siendo procesado');
    }));

    it('debería mostrar el mensaje de estado rechazado', fakeAsync(() => {
        mockOrdersService.getUserOrderById.and.returnValue(Promise.resolve({ success: true, order: mockOrderRejected }));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        const rejectedMessage = fixture.nativeElement.querySelector('.bg-red-50');
        expect(rejectedMessage).toBeTruthy();
        expect(rejectedMessage.textContent).toContain('Este pedido ha sido cancelado');
    }));

    it('debería mostrar los pasos de seguimiento para una orden en tránsito', fakeAsync(() => {
        mockOrdersService.getUserOrderById.and.returnValue(Promise.resolve({ success: true, order: mockOrderInTransit }));
        fixture.detectChanges();
        tick();
        fixture.detectChanges();
        const stepsContainer = fixture.nativeElement.querySelector('.space-y-8');
        expect(stepsContainer).toBeTruthy();
        const steps = fixture.nativeElement.querySelectorAll('.relative.flex.items-start.group');
        expect(steps.length).toBe(4);
    }));
  });

  describe('Métodos de Utilidad y Navegación', () => {
    it('debería navegar a /orders-history cuando se llama a goBack', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/orders-history']);
    });

    it('debería formatear el precio correctamente', () => {
      expect(component.formatPrice(12345.67)).toContain('12.345,67');
    });

    it('debería obtener la etiqueta de estado correcta', () => {
      expect(component.getStatusLabel('pending')).toBe('Pendiente');
      expect(component.getStatusLabel('completed')).toBe('Completado');
    });

    it('debería calcular el total correctamente', () => {
      component.order = mockOrderPending;
      expect(component.getTotal()).toBe(15000);
    });
  });
});