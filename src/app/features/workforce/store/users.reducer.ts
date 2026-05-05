// Scaffolded for SD-2214; full implementation in sibling ticket.
// Mock seed data lets the preview route render an actual table without a backend;
// the sibling ticket replaces this with a real reducer driven by an effect + UserService.
import { createReducer, on } from '@ngrx/store';

import * as UsersActions from './users.actions';
import { UsersFeatureState, initialUsersFeatureState } from './users.selectors';
import { User } from '../models/user.model';
import {
  DEFAULT_USERS_FILTER,
  UsersFilter,
} from '../models/users-filter.model';
import { UserListMeta, UserListResponse } from '../models/users-list.model';

const MOCK_USERS: User[] = [
  {
    id: 1,
    name: 'Victoria',
    last_name: 'Bohorquez',
    email: 'marketing@i-nimble.com',
    role: 2,
    active: 1,
    picture: 'assets/images/default-user-profile-pic.png',
    employee: {
      id: 101,
      position: 'Marketing Specialist Junior',
      hourly_rate: 12,
    },
    company: { id: 1, name: 'Inimble' },
  },
  {
    id: 2,
    name: 'Jovana',
    last_name: 'Silva',
    email: 'pgimmigration@i-nimble.com',
    role: 2,
    active: 1,
    picture: 'assets/images/default-user-profile-pic.png',
    employee: { id: 102, position: 'Legal Assistant', hourly_rate: 14 },
    company: { id: 1, name: 'Inimble' },
  },
  {
    id: 3,
    name: 'Francis',
    last_name: 'Sánchez',
    email: 'design.jr@i-nimble.com',
    role: 2,
    active: 0,
    picture: 'assets/images/default-user-profile-pic.png',
    employee: { id: 103, position: 'Designer', hourly_rate: 13 },
    company: { id: 1, name: 'Inimble' },
  },
  {
    id: 4,
    name: 'Valeria',
    last_name: 'Durán',
    email: 'design@i-nimble.com',
    role: 2,
    active: 1,
    picture: 'assets/images/default-user-profile-pic.png',
    employee: { id: 104, position: 'Designer', hourly_rate: 15 },
    company: { id: 1, name: 'Inimble' },
  },
  {
    id: 5,
    name: 'Paola',
    last_name: 'García',
    email: 'pgarcia@i-nimble.com',
    role: 2,
    active: 1,
    picture: 'assets/images/default-user-profile-pic.png',
    employee: {
      id: 105,
      position: 'Human Resources Assistant',
      hourly_rate: 11,
    },
    company: { id: 1, name: 'Inimble' },
  },
  {
    id: 6,
    name: 'Naisireth',
    last_name: 'Peña',
    email: 'staff.dev@i-nimble.com',
    role: 2,
    active: 1,
    picture: 'assets/images/default-user-profile-pic.png',
    employee: { id: 106, position: 'Staff Developer', hourly_rate: 22 },
    company: { id: 1, name: 'Inimble' },
  },
  {
    id: 7,
    name: 'Andres',
    last_name: 'Palma',
    email: 'andres@i-nimble.com',
    role: 1,
    active: 1,
    picture: 'assets/images/default-user-profile-pic.png',
    employee: { id: 107, position: 'Engineering Manager', hourly_rate: 35 },
    company: { id: 1, name: 'Inimble' },
  },
];

const buildMeta = (filter: UsersFilter, total: number): UserListMeta => {
  const limit = filter.pageSize ?? DEFAULT_USERS_FILTER.pageSize ?? 10;
  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    currentPage: filter.currentPage ?? 1,
    limit,
    sortBy: filter.sortField ?? DEFAULT_USERS_FILTER.sortField ?? 'name',
    sortOrder:
      filter.sortDirection ?? DEFAULT_USERS_FILTER.sortDirection ?? 'asc',
  };
};

const seedList = (filter: UsersFilter): UserListResponse => ({
  items: MOCK_USERS,
  meta: buildMeta(filter, MOCK_USERS.length),
});

export const usersReducer = createReducer<UsersFeatureState>(
  {
    ...initialUsersFeatureState,
    list: seedList(DEFAULT_USERS_FILTER),
  },
  on(UsersActions.loadUsers, (state, { filter }) => ({
    ...state,
    loading: false,
    error: null,
    list: seedList(filter),
    filter,
  })),
  on(UsersActions.setFilter, (state, { filter }) => ({
    ...state,
    filter: { ...state.filter, ...filter },
  })),
  on(UsersActions.deleteUser, (state, { id }) => {
    const items = state.list.items.filter((user) => user.id !== id);
    return {
      ...state,
      list: {
        items,
        meta: buildMeta(state.filter, items.length),
      },
    };
  }),
  on(UsersActions.toggleActive, (state, { id }) => ({
    ...state,
    list: {
      ...state.list,
      items: state.list.items.map((user) =>
        user.id === id ? { ...user, active: user.active === 1 ? 0 : 1 } : user,
      ),
    },
  })),
);
