import { TestBed } from '@angular/core/testing';

import { ToastrService } from 'ngx-toastr';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    toastrSpy = jasmine.createSpyObj<ToastrService>('ToastrService', [
      'success',
      'error',
      'warning',
      'info',
      'clear',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: ToastrService, useValue: toastrSpy }],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('success() should delegate to ToastrService.success', () => {
    service.success('Saved', { title: 'OK' });
    expect(toastrSpy.success).toHaveBeenCalledWith('Saved', 'OK', {});
  });

  it('error() should delegate to ToastrService.error', () => {
    service.error('Oops');
    expect(toastrSpy.error).toHaveBeenCalledWith('Oops', undefined, {});
  });

  it('warning() should delegate to ToastrService.warning', () => {
    service.warning('Careful');
    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('info() should delegate to ToastrService.info', () => {
    service.info('FYI');
    expect(toastrSpy.info).toHaveBeenCalled();
  });

  it('dismissAll() should call ToastrService.clear', () => {
    service.dismissAll();
    expect(toastrSpy.clear).toHaveBeenCalled();
  });

  it('should strip title from the forwarded config object', () => {
    service.success('Done', { title: 'Saved', timeOut: 1000 });
    const args = toastrSpy.success.calls.mostRecent().args;
    expect(args[0]).toBe('Done');
    expect(args[1]).toBe('Saved');
    expect(args[2]).toEqual({ timeOut: 1000 });
  });
});
