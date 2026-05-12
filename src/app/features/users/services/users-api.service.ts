import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { User } from '@features/users/models/user.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/users`;

  getUserList(): Observable<User[]> {
    return this.http.get<User[]>(this.url);
  }
}
