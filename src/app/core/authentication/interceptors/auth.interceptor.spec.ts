import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';

import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([AuthInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('adds Authorization header for API requests when jwt exists', () => {
    spyOn(localStorage, 'getItem').and.returnValue('token-123');

    http.get(`${environment.apiUrl}/users`).subscribe();

    const request = httpController.expectOne(`${environment.apiUrl}/users`);
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer token-123',
    );
    request.flush({});
  });

  it('does not add Authorization header for non API requests', () => {
    spyOn(localStorage, 'getItem').and.returnValue('token-123');

    http.get('https://example.com/health').subscribe();

    const request = httpController.expectOne('https://example.com/health');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('does not add Authorization header when jwt does not exist', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);

    http.get(`${environment.apiUrl}/users`).subscribe();

    const request = httpController.expectOne(`${environment.apiUrl}/users`);
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('does not add Authorization header for amazonaws requests', () => {
    spyOn(localStorage, 'getItem').and.returnValue('token-123');

    const s3Url = `${environment.s3}/uploads/file.pdf`;
    http.get(s3Url).subscribe();

    const request = httpController.expectOne(s3Url);
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('treats trailing slash API URLs as API requests', () => {
    spyOn(localStorage, 'getItem').and.returnValue('token-123');

    const trailingSlashUrl = `${environment.apiUrl}/`;
    http.get(trailingSlashUrl).subscribe();

    const request = httpController.expectOne(trailingSlashUrl);
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer token-123',
    );
    request.flush({});
  });
});
