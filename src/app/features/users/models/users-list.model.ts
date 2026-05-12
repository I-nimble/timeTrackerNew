import { User } from './user.model';
import { UsersSortDirection, UsersSortField } from './users-filter.model';

export type UsersListColumn =
  | 'select'
  | 'name'
  | 'role'
  | 'email'
  | 'status'
  | 'schedule'
  | 'reports'
  | 'actions';

export const DEFAULT_USERS_LIST_COLUMNS: UsersListColumn[] = [
  'name',
  'email',
  'status',
  'schedule',
  'reports',
  'actions',
];

export interface UserListMeta {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  sortBy: UsersSortField;
  sortOrder: UsersSortDirection;
}

export interface UserListResponse {
  items: User[];
  meta: UserListMeta;
  message?: string;
}
