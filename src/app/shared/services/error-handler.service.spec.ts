import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ErrorHandlerService } from './error-handler.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let logger: jasmine.SpyObj<LoggerService>;
  let notifications: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', [
      'debug',
      'info',
      'warn',
      'error',
    ]);
    notifications = jasmine.createSpyObj<NotificationService>(
      'NotificationService',
      ['success', 'error', 'warning', 'info', 'dismissAll'],
    );
    router = jasmine.createSpyObj<Router>('Router', ['navigate'], {
      url: '/some-page',
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: logger },
        { provide: NotificationService, useValue: notifications },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(ErrorHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('handleError() should log the error and show a notification', () => {
    service.handleError(new Error('kaboom'));
    expect(logger.error).toHaveBeenCalled();
    expect(notifications.error).toHaveBeenCalledWith('kaboom');
  });

  it('report() with silent=true should log but NOT notify', () => {
    service.report(new Error('quiet'), { silent: true });
    expect(logger.error).toHaveBeenCalled();
    expect(notifications.error).not.toHaveBeenCalled();
  });

  it('should extract the message from HttpErrorResponse body.message', () => {
    const err = new HttpErrorResponse({
      error: { message: 'Validation failed' },
      status: 400,
      statusText: 'Bad Request',
    });
    service.report(err);
    expect(notifications.error).toHaveBeenCalledWith('Validation failed');
  });

  it('should extract the message from a string HttpErrorResponse body', () => {
    const err = new HttpErrorResponse({
      error: 'Unauthorized access',
      status: 401,
      statusText: 'Unauthorized',
    });
    service.report(err);
    expect(notifications.error).toHaveBeenCalledWith('Unauthorized access');
  });

  it('should use the fallback message when no message can be extracted', () => {
    service.report({}, { fallbackMessage: 'Default' });
    expect(notifications.error).toHaveBeenCalledWith('Default');
  });

  it('should extract the message from a plain string error', () => {
    service.report('boom');
    expect(notifications.error).toHaveBeenCalledWith('boom');
  });

  describe('HTTP-specific error handling', () => {
    it('handle() should log, notify, and emit error', (done) => {
      const error = {
        message: 'Not found',
        status: 404,
        timestamp: new Date(),
      };

      service.error$.subscribe((emitted) => {
        expect(emitted).toEqual(error);
        done();
      });

      service.handle(error);
      expect(logger.error).toHaveBeenCalledWith('[HTTP 404] Not found', error);
      expect(notifications.error).toHaveBeenCalledWith('Not found');
    });

    it('handle() with 401 status should redirect to login', () => {
      const error = {
        message: 'Unauthorized',
        status: 401,
        timestamp: new Date(),
      };

      service.handle(error);
      expect(router.navigate).toHaveBeenCalledWith(['/authentication/login']);
    });

    it('fromHttp() should create AppError from HttpErrorResponse', () => {
      const httpError = new HttpErrorResponse({
        error: { message: 'User already exists' },
        status: 409,
        statusText: 'Conflict',
      });

      const appError = service.fromHttp(httpError, '/api/users');
      expect(appError.status).toBe(409);
      expect(appError.message).toBe('User already exists');
      expect(appError.url).toBe('/api/users');
      expect(appError.timestamp).toBeTruthy();
      expect(appError.original).toBe(httpError);
    });

    it('fromHttp() should extract validation errors', () => {
      const httpError = new HttpErrorResponse({
        error: {
          message: 'Validation failed',
          errors: [
            { field: 'email', error: 'Invalid format' },
            { field: 'password', error: 'Too short' },
          ],
        },
        status: 400,
        statusText: 'Bad Request',
      });

      const appError = service.fromHttp(httpError, '/api/register');
      expect(appError.validation).toEqual([
        { field: 'email', error: 'Invalid format' },
        { field: 'password', error: 'Too short' },
      ]);
    });

    it('fromHttp() should use default message for unknown status', () => {
      const httpError = new HttpErrorResponse({
        error: null,
        status: 418,
        statusText: "I'm a teapot",
      });

      const appError = service.fromHttp(httpError, '/api/test');
      expect(appError.message).toBe('An unexpected error occurred.');
    });
  });
});
