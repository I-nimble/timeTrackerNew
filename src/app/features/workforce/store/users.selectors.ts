// Scaffolded for SD-2214; full implementation in sibling ticket.
import { createFeatureSelector, createSelector } from '@ngrx/store';

import { User } from '../models/user.model';
import {
  DEFAULT_USERS_FILTER,
  UsersFilter,
} from '../models/users-filter.model';
import { UserListResponse } from '../models/users-list.model';

export interface UsersFeatureState {
  list: UserListResponse;
  loading: boolean;
  error: string | null;
  filter: UsersFilter;
  formOpen: boolean;
  editingUser: User | null;
}

export const initialUsersFeatureState: UsersFeatureState = {
  list: {
    items: [],
    meta: {
      total: 0,
      totalPages: 0,
      currentPage: 1,
      limit: DEFAULT_USERS_FILTER.pageSize ?? 10,
      sortBy: DEFAULT_USERS_FILTER.sortField ?? 'name',
      sortOrder: DEFAULT_USERS_FILTER.sortDirection ?? 'asc',
    },
  },
  loading: false,
  error: null,
  filter: DEFAULT_USERS_FILTER,
  formOpen: false,
  editingUser: null,
};

export const selectUsersFeature =
  createFeatureSelector<UsersFeatureState>('users');

export const selectUsersList = createSelector(
  selectUsersFeature,
  (state) => state.list,
);

export const selectLoading = createSelector(
  selectUsersFeature,
  (state) => state.loading,
);

export const selectError = createSelector(
  selectUsersFeature,
  (state) => state.error,
);

export const selectFilter = createSelector(
  selectUsersFeature,
  (state) => state.filter,
);

export const selectFormOpen = createSelector(
  selectUsersFeature,
  (state) => state.formOpen,
);

export const selectEditingUser = createSelector(
  selectUsersFeature,
  (state) => state.editingUser,
);
