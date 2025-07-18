import { Injectable } from '@angular/core';
import { EntriesService } from './entries.service';
import { NotificationsService } from './notifications.service';
import { Observable, forkJoin, map, of } from 'rxjs';
import { HistoryItem } from '../models/History';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  constructor(
    private entriesService: EntriesService,
    private notificationsService: NotificationsService,
    private http: HttpClient
  ) {}

  getTeamMembers() {
    return this.http.get<any[]>('/api/employees', {});
  }

  getUserHistory(userId: number): Observable<HistoryItem[]> {
    return forkJoin({
      entries: this.entriesService.getUsersEntries(userId),
      notifications: this.notificationsService.getAll(),
    }).pipe(
      map(({ entries, notifications }) => {
        const history: HistoryItem[] = [];

        const entryList = entries as any[];
        const notifList = notifications as any[];

        entryList
          .filter((e) => e.type === 'clock-in')
          .forEach((e) => {
            history.push({
              type: 'clock-in',
              date: e.createdAt,
              message: 'User clocked in',
            });
          });

        entryList
          .filter((e) => e.type === 'clock-out')
          .forEach((e) => {
            history.push({
              type: 'clock-out',
              date: e.createdAt,
              message: 'User clocked out',
            });
          });

        notifList.forEach((notif: any) => {
          const isUserNotification =
            notif.users_notifications?.user_id === userId;

          if (!isUserNotification) return;

          const msg = notif.message?.toLowerCase() || '';

          if (msg.includes('created task')) {
            history.push({
              type: 'task-created',
              date: notif.createdAt,
              message: notif.message,
            });
          } else if (msg.includes('updated task')) {
            history.push({
              type: 'task-updated',
              date: notif.createdAt,
              message: notif.message,
            });
          } else if (msg.includes('talent match') || msg.includes('matched')) {
            history.push({
              type: 'talent-match',
              date: notif.createdAt,
              message: notif.message,
            });
          }
        });

        history.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return history;
      })
    );
  }
}
