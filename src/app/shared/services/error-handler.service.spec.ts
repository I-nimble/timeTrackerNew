import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ErrorHandlerService } from './error-handler.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let logger: jasmine.SpyObj<LoggerService>;
  let notifications: jasmine.SpyObj<NotificationService>;

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

    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: logger },
        { provide: NotificationService, useValue: notifications },
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
});
