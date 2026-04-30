import { TestBed } from '@angular/core/testing';

import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('error() should forward to console.error', () => {
    const spy = spyOn(console, 'error');
    service.error('boom', { id: 1 });
    expect(spy).toHaveBeenCalled();
    const args = spy.calls.mostRecent().args;
    expect(args).toContain('boom');
    expect(args).toContain(jasmine.objectContaining({ id: 1 }));
  });

  it('warn() should forward to console.warn', () => {
    const spy = spyOn(console, 'warn');
    service.warn('careful');
    expect(spy).toHaveBeenCalled();
  });

  it('info() should forward to console.info in non-production', () => {
    const spy = spyOn(console, 'info');
    service.info('hello');
    expect(spy).toHaveBeenCalled();
  });

  it('debug() should forward to console.debug in non-production', () => {
    const spy = spyOn(console, 'debug');
    service.debug('trace');
    expect(spy).toHaveBeenCalled();
  });

  it('withScope() should prefix messages with the scope name', () => {
    const spy = spyOn(console, 'info');
    const scoped = service.withScope('Users');
    scoped.info('loaded');
    const args = spy.calls.mostRecent().args;
    expect(
      args.some((a) => typeof a === 'string' && a.includes('[Users] loaded')),
    ).toBe(true);
  });

  it('withScope() should forward errors at the correct level', () => {
    const spy = spyOn(console, 'error');
    service.withScope('Auth').error('failed');
    expect(spy).toHaveBeenCalled();
  });
});
