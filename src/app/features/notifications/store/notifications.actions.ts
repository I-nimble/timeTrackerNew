import { Notification } from '@app/models/Notifications';
import { NotificationSubmitPayload } from '@features/notifications/models/notifications.model';
import { createActionGroup, props } from '@ngrx/store';
import { AppError } from '@shared/services';

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Load Notifications': props<{ days?: number }>(),
    'Load Notifications Success': props<{ notifications: Notification[] }>(),
    'Load Notifications Failure': props<{ error: AppError }>(),

    'Create Notification': props<{ payload: NotificationSubmitPayload }>(),
    'Create Notification Success': props<{ notification: Notification }>(),
    'Create Notification Failure': props<{ error: AppError }>(),

    'Update Notification': props<{
      id: number;
      payload: NotificationSubmitPayload;
    }>(),
    'Update Notification Success': props<{ notification: Notification }>(),
    'Update Notification Failure': props<{ error: AppError }>(),

    'Delete Notification': props<{ id: number }>(),
    'Delete Notification Success': props<{ id: number }>(),
    'Delete Notification Failure': props<{ error: AppError }>(),

    'Update Notification Status': props<{
      notifications: Notification[];
      status: number;
    }>(),
    'Update Notification Status Success': props<{
      notifications: Notification[];
      status: number;
    }>(),
    'Update Notification Status Failure': props<{ error: AppError }>(),
  },
});
