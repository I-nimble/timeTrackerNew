import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';

import { UsersApiService } from './users-api.service';

describe('UsersApiService', () => {
  let service: UsersApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsersApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UsersApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('hits GET /api/users and returns the array body', () => {
    const sample = [{ id: 1, name: 'Andrea' }];
    let result: unknown[] = [];

    service.getUserList().subscribe((rows) => (result = rows));

    const req = http.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(sample);

    expect(result).toEqual(sample);
  });
});
