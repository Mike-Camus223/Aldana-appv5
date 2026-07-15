import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrdersManagementComponent } from './orders-management.component';
import { OrdersService } from '../../../../core/services/orders/orders.service';
import { NotificationService } from '../../../../core/services/notification.service';

describe('OrdersManagementComponent', () => {
  let component: OrdersManagementComponent;
  let fixture: ComponentFixture<OrdersManagementComponent>;
  let mockOrdersService: any;
  let mockNotificationService: any;

  beforeEach(async () => {
    mockOrdersService = {
      getAllOrdersAdmin: jasmine.createSpy('getAllOrdersAdmin').and.resolveTo({
        success: true,
        orders: [
          { id: '1', order_number: '123', status: 'pending', customer_first_name: 'Juan', customer_last_name: 'Perez', customer_email: 'juan@test.com' },
          { id: '2', order_number: '456', status: 'preparing', customer_first_name: 'Ana', customer_last_name: 'Gomez', customer_email: 'ana@test.com' }
        ]
      }),
      updateOrderStatusAdmin: jasmine.createSpy('updateOrderStatusAdmin').and.resolveTo({ success: true })
    };

    mockNotificationService = {
      showSuccess: jasmine.createSpy('showSuccess'),
      showError: jasmine.createSpy('showError')
    };

    await TestBed.configureTestingModule({
      imports: [OrdersManagementComponent],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders and filter them on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockOrdersService.getAllOrdersAdmin).toHaveBeenCalled();
    expect(component.orders.length).toBe(2);
    expect(component.filteredOrders.length).toBe(2);
  });

  it('should filter orders by status tab and query text', () => {
    component.orders = [
      { id: '1', order_number: '123', status: 'pending', customer_first_name: 'Juan', customer_last_name: 'Perez', customer_email: 'juan@test.com' },
      { id: '2', order_number: '456', status: 'preparing', customer_first_name: 'Ana', customer_last_name: 'Gomez', customer_email: 'ana@test.com' }
    ];

    component.selectedStatusTab = 'pending';
    component.applyFilters();
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].customer_first_name).toBe('Juan');

    component.selectedStatusTab = 'all';
    component.searchQuery = 'Gomez';
    component.applyFilters();
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].customer_first_name).toBe('Ana');
  });
});
