import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ErrorHandlerService, type AppError } from '@shared/services';

import { ErrorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;

  beforeEach(() => {
    errorHandler = jasmine.createSpyObj<ErrorHandlerService>(
      'ErrorHandlerService',
      ['fromHttp', 'handle'],
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: ErrorHandlerService, useValue: errorHandler },
        provideHttpClient(withInterceptors([ErrorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('passes through successful responses without invoking ErrorHandlerService', () => {
    let didReceiveSuccess = false;

    http.get<{ ok: boolean }>('/api/ping').subscribe((response) => {
      didReceiveSuccess = response.ok;
    });

    const request = httpController.expectOne('/api/ping');
    request.flush({ ok: true });

    expect(didReceiveSuccess).toBeTrue();
    expect(errorHandler.fromHttp).not.toHaveBeenCalled();
    expect(errorHandler.handle).not.toHaveBeenCalled();
  });

  it('maps HttpErrorResponse and delegates to ErrorHandlerService', () => {
    const mappedError: AppError = {
      message: 'Server failed',
      status: 500,
      url: '/api/fail',
      timestamp: new Date(),
    };
    errorHandler.fromHttp.and.returnValue(mappedError);

    let receivedStatus = -1;

    http.get('/api/fail').subscribe({
      error: (error) => {
        receivedStatus = (error as HttpErrorResponse).status;
      },
    });

    const request = httpController.expectOne('/api/fail');
    request.flush(
      { message: 'Internal server error' },
      { status: 500, statusText: 'Server Error' },
    );

    expect(errorHandler.fromHttp).toHaveBeenCalledTimes(1);
    const [httpError, requestUrl] =
      errorHandler.fromHttp.calls.mostRecent().args;
    expect(httpError instanceof HttpErrorResponse).toBeTrue();
    expect(requestUrl).toBe('/api/fail');
    expect(errorHandler.handle).toHaveBeenCalledWith(mappedError);
    expect(receivedStatus).toBe(500);
  });

  it('skips global error handling for amazonaws requests', () => {
    const s3Url = 'https://inimble-app.s3.us-east-1.amazonaws.com/file.txt';
    let receivedStatus = -1;

    http.get(s3Url).subscribe({
      error: (error) => {
        receivedStatus = (error as HttpErrorResponse).status;
      },
    });

    const request = httpController.expectOne(s3Url);
    request.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(errorHandler.fromHttp).not.toHaveBeenCalled();
    expect(errorHandler.handle).not.toHaveBeenCalled();
    expect(receivedStatus).toBe(403);
  });
});
