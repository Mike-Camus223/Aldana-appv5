import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { resultScreenGuard } from './result-screen.guard';

describe('resultScreenGuard', () => {
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow activation when status and orderId query params exist', () => {
    const routeMock: any = {
      queryParams: { status: 'approved', orderId: '123' }
    };
    const stateMock: any = {};

    const result = TestBed.runInInjectionContext(() => resultScreenGuard(routeMock, stateMock));
    expect(result).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should deny activation and redirect when query params are missing', () => {
    const routeMock: any = {
      queryParams: {}
    };
    const stateMock: any = {};

    const result = TestBed.runInInjectionContext(() => resultScreenGuard(routeMock, stateMock));
    expect(result).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });
});
