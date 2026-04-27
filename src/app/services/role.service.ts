import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Role {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles`;
  private roles$: Observable<Role[]> | null = null;

  getRoles(): Observable<Role[]> {
    if (!this.roles$) {
      this.roles$ = this.http.get<Role[]>(this.apiUrl).pipe(
        shareReplay(1),
        catchError(() => {
          this.roles$ = null; // allow retry on next navigation attempt
          return of([]);
        }),
      );
    }
    return this.roles$;
  }

  getSlugById(id: string | number): Observable<string | null> {
    return this.getRoles().pipe(
      map(
        (roles) => roles.find((r) => String(r.id) === String(id))?.name ?? null,
      ),
    );
  }

  invalidateCache(): void {
    this.roles$ = null;
  }
}
