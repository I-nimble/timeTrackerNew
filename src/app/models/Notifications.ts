export interface notificationCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  notifications: Notification[];
}

export interface Notification {
  id: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
  type_id: number;
  application_id?: number;
  users_notifications: usersNotification;
}

export interface usersNotification {
  user_id: number;
  notification_id: number,
  status: number;
}