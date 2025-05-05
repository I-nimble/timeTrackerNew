import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

type NotificationState = {
  notifications: Notification[];
};

interface Notification {
  id: number;
  show: boolean;
  message: string;
  type: string;
}

const initialState: NotificationState = {
  notifications: [],
};

export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withEntities(),
  withState(initialState),
  withMethods(
    (store: any) => ({
      async addNotifications(message: string, type: string = 'normal') {
        const newNotification: Notification = {
          message,
          type,
          show: true,
          id: Date.now(),
        };
        patchState(store, (state: any) => ({
          notifications: [...state.notifications, newNotification],
        }));
        setTimeout(() => {
          this.removeNotification(newNotification.id);
        }, 25000);
      },
      removeNotification(id: number) {
        patchState(store, (state: any) => ({
          notifications: state.notifications.map((notification: any) =>
            notification.id == id
              ? { ...notification, show: false }
              : notification
          ),
        }));
        setTimeout(() => {
          patchState(store, (state: any) => ({
            notifications: state.notifications.filter(
              (notification: any) => notification.id !== id
            ),
          }));
        }, 300);
      },
      removeAll() {
        patchState(store, (state: any) => ({
          notifications: state.notifications.map((notification: any) => {
            return { ...notification, show: false }
          }),
        }));
        setTimeout(() => {
          patchState(store, (state: any) => ({
            notifications: [],
          }));
        }, 300);
      },
    })
  )
);
