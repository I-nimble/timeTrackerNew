export type UsersSortDirection = 'asc' | 'desc';

export type UsersSortField = 'name' | 'email' | 'role' | 'createdAt';

export interface UsersFilter {
  role?: number;
  status?: boolean;
  id?: number;
  currentUser?: boolean;
  includeAdmins?: boolean;
  searchField?: string;
  currentPage?: number;
  pageSize?: number;
  sortField?: UsersSortField;
  sortDirection?: UsersSortDirection;
}

export const DEFAULT_USERS_FILTER: UsersFilter = {
  currentUser: false,
  includeAdmins: true,
  searchField: '',
  currentPage: 1,
  pageSize: 10,
  sortField: 'name',
  sortDirection: 'asc',
};
