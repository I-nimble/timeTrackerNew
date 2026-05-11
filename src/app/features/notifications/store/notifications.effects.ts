import { Injectable, inject } from '@angular/core';

import { Notification } from '@app/models/Notifications';
import { NotificationsService } from '@app/services/notifications.service';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  ErrorHandlerService,
  LoggerService,
  NotificationService,
} from '@shared/services';
import { catchError, concatMap, map, of, switchMap, tap } from 'rxjs';

import { NotificationsActions } from './notifications.actions';

@Injectable()
export class NotificationsEffects {
  private readonly actions$ = inject(Actions);
  private readonly apiService = inject(NotificationsService);
  private readonly notificationService = inject(NotificationService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly logger = inject(LoggerService).withScope('Notifications');

  loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.loadNotifications),
      switchMap(({ days }) =>
        this.apiService.get(days).pipe(
          tap((notifications) =>
            this.logger.info('Notifications loaded', {
              count: (notifications as Notification[]).length,
            }),
          ),
          map((notifications) =>
            NotificationsActions.loadNotificationsSuccess({
              notifications: notifications as Notification[],
            }),
          ),
          catchError((error: unknown) => {
            const appError = this.errorHandler.fromUnknown(
              error,
              '/notifications',
            );
            this.errorHandler.handle(appError);
            return of(
              NotificationsActions.loadNotificationsFailure({
                error: appError,
              }),
            );
          }),
        ),
      ),
    ),
  );

  createNotification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.createNotification),
      concatMap(({ payload }) =>
        this.apiService.submit(payload).pipe(
          tap((notification) => {
            this.logger.info('Notification created', {
              id: (notification as Notification)?.id,
            });
            this.notificationService.success(
              'Notification created successfully',
            );
          }),
          map((notification) =>
            NotificationsActions.createNotificationSuccess({
              notification: notification as Notification,
            }),
          ),
          catchError((error: unknown) => {
            const appError = this.errorHandler.fromUnknown(
              error,
              '/notifications',
            );
            this.errorHandler.handle(appError);
            return of(
              NotificationsActions.createNotificationFailure({
                error: appError,
              }),
            );
          }),
        ),
      ),
    ),
  );

  updateNotification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.updateNotification),
      concatMap(({ id, payload }) =>
        this.apiService.submit(payload, id).pipe(
          tap((notification) => {
            this.logger.info('Notification updated', {
              id: (notification as Notification)?.id,
            });
            this.notificationService.success(
              'Notification updated successfully',
            );
          }),
          map((notification) =>
            NotificationsActions.updateNotificationSuccess({
              notification: notification as Notification,
            }),
          ),
          catchError((error: unknown) => {
            const appError = this.errorHandler.fromUnknown(
              error,
              `/notifications/${id}`,
            );
            this.errorHandler.handle(appError);
            return of(
              NotificationsActions.updateNotificationFailure({
                error: appError,
              }),
            );
          }),
        ),
      ),
    ),
  );

  deleteNotification$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.deleteNotification),
      concatMap(({ id }) =>
        this.apiService.delete(id).pipe(
          tap(() => {
            this.logger.info('Notification deleted', { id });
            this.notificationService.success('Notification deleted');
          }),
          map(() => NotificationsActions.deleteNotificationSuccess({ id })),
          catchError((error: unknown) => {
            const appError = this.errorHandler.fromUnknown(
              error,
              `/notifications/${id}`,
            );
            this.errorHandler.handle(appError);
            return of(
              NotificationsActions.deleteNotificationFailure({
                error: appError,
              }),
            );
          }),
        ),
      ),
    ),
  );

  updateNotificationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.updateNotificationStatus),
      concatMap(({ notifications, status }) =>
        this.apiService.update(notifications, status).pipe(
          tap(() => {
            this.logger.info('Notification status updated', {
              count: notifications.length,
              status,
            });
            this.notificationService.success('Notifications status updated');
          }),
          map(() =>
            NotificationsActions.updateNotificationStatusSuccess({
              notifications,
              status,
            }),
          ),
          catchError((error: unknown) => {
            const appError = this.errorHandler.fromUnknown(
              error,
              '/notifications/status',
            );
            this.errorHandler.handle(appError);
            return of(
              NotificationsActions.updateNotificationStatusFailure({
                error: appError,
              }),
            );
          }),
        ),
      ),
    ),
  );
}
