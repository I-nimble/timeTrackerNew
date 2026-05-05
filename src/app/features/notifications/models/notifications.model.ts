export interface NotificationSubmitPayload {
  cv?: File;
  message?: string;
  type_id: number;
  selectedUsers: { user_id: number; checked: boolean }[];
}

export type {
  notificationCategory,
  Notification,
  usersNotification,
} from '../../../models/Notifications';
