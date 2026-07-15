import { TestBed } from '@angular/core/testing';
import { MiCorreoService } from './micorreo.service';

describe('MiCorreoService', () => {
  let service: MiCorreoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MiCorreoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
