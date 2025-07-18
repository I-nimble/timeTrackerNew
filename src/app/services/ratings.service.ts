import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Ratings } from '../models/Ratings.model';
import { forkJoin, Observable } from 'rxjs';
import { SchedulesService } from 'src/app/services/schedules.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CustomDatePipe } from './custom-date.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RatingsService {
  // store = inject(NotificationStore);

  constructor(
    private http: HttpClient,
    public schedulesService: SchedulesService,
    private ratingsEntriesService: RatingsEntriesService,
    private customDate: CustomDatePipe,
    public snackBar: MatSnackBar,
  ) {}
  private API_URI = environment.apiUrl + '/ratings';

  public get(): Observable<Ratings[]> {
    return this.http.get<Ratings[]>(`${this.API_URI}`);
  }

  public getById(id: number): Observable<Ratings[]> {
    return this.http.get<Ratings[]>(`${this.API_URI}/${id}`);
  }

  public getByUser(id: any): Observable<Ratings[]> {
    return this.http
      .get(`${this.API_URI}/user/${id}`)
      .pipe(map((res: any) => res.ratings));
  }

  public getByNullUser(id: number): Observable<Ratings[]> {
    return this.http
      .get(`${this.API_URI}/user-null/${id}`)
      .pipe(map((res: any) => res.ratings));
  }

  public submit(data: any, id: any = null) {
    if (id != null) return this.http.put(`${this.API_URI}/${id}`, data)
    return this.http.post(`${this.API_URI}`, data);
  }

  public rate(data: any, id: any = null) {
    return this.http.put(`${this.API_URI}/rate/${id}`, data);
  }

  public delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }

  public checkToDoLogged(date: Date): Observable<any> {
    return this.get().pipe(
      switchMap((toDo) => {
        const toDoArray = toDo.map((toDo) => ({
          rating_id: toDo.id,
          date: this.dateStr(date),
        }));
        return this.ratingsEntriesService.checkPending({ toDo: toDoArray });
      }),
      switchMap((res) => {
        return of(res);
      }),
      catchError((err) => {
        return of({ result: 'error', error: err });
      })
    );
  }

  public getToDo(selectedDate: any, userId: number | null = null): Observable<any[]> {
    return forkJoin({
      schedules: this.schedulesService.get(),
      toDo: userId ? this.getByUser(userId) : this.get(),
    }).pipe(
      map(({ schedules, toDo }) => {
        let toDoArray: any = [];
        if (
          schedules &&
          typeof schedules === 'object' &&
          'schedules' in schedules
        ) {
          const schedulesArray = schedules.schedules;
          if (Array.isArray(schedulesArray) && schedulesArray.length <= 0) {
            this.openSnackBar('You don\'t have a defined schedule.', 'Close');
          } else if (Array.isArray(schedulesArray)) {
            toDoArray = toDo;
            const dayOfWeek = selectedDate.getDay();
            schedulesArray.forEach((schedule: any) => {
              const scheduleDays = schedule.days;
              const matchingDay = scheduleDays.find(
                (day: any) => dayOfWeek == day.id
              );
              if (matchingDay) {
                toDoArray = toDo;
              } else {
                toDoArray = [];
              }
              
            });
          }
          return toDoArray;
        }
      })
    );
  }

  dateStr(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getPriorities() {
    return this.http.get<any[]>(`${this.API_URI}/priorities`);
  }

  openSnackBar(message: string, action: string): void {
    this.snackBar.open(message, action, {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
