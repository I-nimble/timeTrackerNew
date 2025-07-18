export interface HistoryItem {
  id?: number;
  user_id?: number;
  action?: string;
  type: 'clock-in' | 'clock-out' | 'task-created' | 'task-updated' | 'talent-match' | string;
  date: string;
  message: string;
}
