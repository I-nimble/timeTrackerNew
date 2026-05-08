import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { LegacyUserRecord } from '@features/users/models/users-list.types';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  getUserList(): Observable<LegacyUserRecord[]> {
    return this.http.get<LegacyUserRecord[]>(this.url);
  }
}
