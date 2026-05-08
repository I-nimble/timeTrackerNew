import { User } from './user.model';

export interface UsersListPageFilters {
  searchTerm?: string;
  companyId?: number | string | null;
  role?: number | string | null;
  status?: 'all' | 'online' | 'offline';
  predicate?: (row: User) => boolean;
}
