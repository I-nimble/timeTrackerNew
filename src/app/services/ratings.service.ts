import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Ratings } from '../models/Ratings.model';
import { forkJoin, Observable } from 'rxjs';
import { Frequency } from '../models/Frequency.model';
import { NotificationStore } from 'src/app/stores/notification.store';
import { SchedulesService } from 'src/app/services/schedules.service';
import { RatingsEntriesService } from 'src/app/services/ratings_entries.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CustomDatePipe } from './custom-date.pipe';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RatingsService {
  store = inject(NotificationStore);

  constructor(
    private http: HttpClient,
    public schedulesService: SchedulesService,
    private ratingsEntriesService: RatingsEntriesService,
    private customDate: CustomDatePipe
  ) {}
  private API_URI = environment.apiUrl + '/ratings';

  public get(): Observable<Ratings[]> {
    return this.http.get<Ratings[]>(`${this.API_URI}`);
  }

  public getById(id: number): Observable<Ratings[]> {
    return this.http.get<Ratings[]>(`${this.API_URI}/${id}`);
  }

  public getByUser(id: number): Observable<Ratings[]> {
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
    if (id) return this.http.put(`${this.API_URI}/${id}`, data);
    return this.http.post(`${this.API_URI}`, data);
  }

  public rate(data: any, id: any = null) {
    return this.http.put(`${this.API_URI}/rate/${id}`, data);
  }

  public delete(id: number) {
    return this.http.delete(`${this.API_URI}/${id}`);
  }

  public getFrequencies(): Observable<Frequency[]> {
    return this.http.get<Frequency[]>(`${environment.apiUrl}/frequencies`);
  }

  public checkToDoLogged(date: Date): Observable<any> {
    return this.getToDo(date).pipe(
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

  public getToDo(selectedDate: any): Observable<any[]> {
    return forkJoin({
      schedules: this.schedulesService.get(),
      toDo: this.get(),
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
            this.store.addNotifications("You don't have a defined schedule.");
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

  isLastWorkingDayOfWeek(schedule: any, today: any) {
    const lastWorkingDay = schedule.reduce(
      (max: any, current: any) => (current.id > max.id ? current : max),
      schedule[0]
    );
    return today.id == lastWorkingDay.id;
  }

  isHalfwayThroughWorkingWeek(schedule: any, dayOfWeek: any) {
    const workingDays = schedule.map((day: any) => day.id);
    const halfwayPoint = Math.ceil(workingDays.length / 2);
    return dayOfWeek === halfwayPoint;
  }

  isLastWorkingDayOfMonth(schedule: any, selectedDate: any) {
    const today = selectedDate;
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const workingDays = schedule.map((day: any) => day.id);
    for (let day = lastDayOfMonth; day >= 1; day--) {
      const currentDate = new Date(
        `${year}-${this.customDate.padzero(month)}-${this.customDate.padzero(
          day
        )}T00:00:00`
      );
      let dayOfWeek = currentDate.getDay();
      if (dayOfWeek == 0) dayOfWeek = 7;
      if (workingDays.includes(dayOfWeek)) {
        return today.getDate() === day;
      }
    }
    return false;
  }

  isHalfwayThroughWorkingMonth(schedule: any, selectedDate: any) {
    const today = selectedDate;
    const year = today.getFullYear();
    const month = today.getMonth();
    const halfway = 15;
    const workingDays = schedule.map((day: any) => day.id);
    for (let day = halfway; day >= 1; day--) {
      const currentDate = new Date(
        `${year}-${this.customDate.padzero(month)}-${this.customDate.padzero(
          day
        )}T00:00:00`
      );
      let dayOfWeek = currentDate.getDay();
      if (dayOfWeek == 0) dayOfWeek = 7;
      if (workingDays.includes(dayOfWeek)) {
        return today.getDate() === day;
      }
    }
    return false;
  }

  isEndOfQuarter(schedule: any, selectedDate: any) {
    const quarterMonths = [3, 6, 9, 12];
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    if (quarterMonths.includes(month)) {
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const workingDays = schedule.map((day: any) => day.id);
      for (let day = lastDayOfMonth; day >= 1; day--) {
        const currentDate = new Date(
          `${year}-${this.customDate.padzero(month)}-${this.customDate.padzero(
            day
          )}T00:00:00`
        );
        let dayOfWeek = currentDate.getDay();
        if (dayOfWeek == 0) dayOfWeek = 7;
        if (workingDays.includes(dayOfWeek)) {
          return selectedDate.getDate() === day;
        }
      }
    }
    return false;
  }

  isHalfwayOfYear(schedule: any, selectedDate: any) {
    const halfMonths = [6, 12];
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    if (halfMonths.includes(month)) {
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const workingDays = schedule.map((day: any) => day.id);
      for (let day = lastDayOfMonth; day >= 1; day--) {
        const currentDate = new Date(
          `${year}-${this.customDate.padzero(month)}-${this.customDate.padzero(
            day
          )}T00:00:00`
        );
        let dayOfWeek = currentDate.getDay();
        if (dayOfWeek == 0) dayOfWeek = 7;
        if (workingDays.includes(dayOfWeek)) {
          return selectedDate.getDate() === day;
        }
      }
    }
    return false;
  }

  isLastWorkingDayOfYear(schedule: any, selectedDate: any) {
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();

    if (month == 12) {
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const workingDays = schedule.map((day: any) => day.id);
      for (let day = lastDayOfMonth; day >= 1; day--) {
        const currentDate = new Date(
          `${year}-${this.customDate.padzero(month)}-${this.customDate.padzero(
            day
          )}T00:00:00`
        );
        let dayOfWeek = currentDate.getDay();
        if (dayOfWeek == 0) dayOfWeek = 7;
        if (workingDays.includes(dayOfWeek)) {
          return selectedDate.getDate() === day;
        }
      }
    }
    return false;
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
}
