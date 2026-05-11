import { Routes } from '@angular/router';

import { provideState } from '@ngrx/store';

import { notesReducer } from './store/notes.reducer';

export const NotesRoutes: Routes = [
  {
    path: '',
    providers: [provideState('notes', notesReducer)],
    // TODO: NotesPageComponent (smart)
    // loadComponent: () =>
    //   import('./pages/notes-page/notes-page.component').then(
    //     (m) => m.NotesPageComponent
    //   ),
    data: { title: 'Notes' },
  },
];
