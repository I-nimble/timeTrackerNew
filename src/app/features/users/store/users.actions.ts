// Scaffolded for SD-2214; full implementation in sibling ticket.
import { createAction, props } from '@ngrx/store';

import { User } from '../models/user.model';
import { UsersFilter } from '../models/users-filter.model';

export const loadUsers = createAction(
  '[Users Page] Load Users',
  props<{ filter: UsersFilter }>(),
);

export const setFilter = createAction(
  '[Users Page] Set Filter',
  props<{ filter: Partial<UsersFilter> }>(),
);

export const openForm = createAction(
  '[Users Page] Open Form',
  props<{ user?: User }>(),
);

export const closeForm = createAction('[Users Page] Close Form');

export const createUser = createAction(
  '[Users Form] Create User',
  props<{ user: User }>(),
);

export const updateUser = createAction(
  '[Users Form] Update User',
  props<{ user: User }>(),
);

export const deleteUser = createAction(
  '[Users List] Delete User',
  props<{ id: number }>(),
);

export const toggleActive = createAction(
  '[Users List] Toggle Active',
  props<{ id: number }>(),
);
