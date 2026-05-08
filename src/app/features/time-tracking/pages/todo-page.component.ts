import { Component } from '@angular/core';

import { AppTodoComponent } from 'src/app/legacy/pages/apps/todo/todo.component';

@Component({
  selector: 'app-time-tracking-todo-page',
  standalone: true,
  imports: [AppTodoComponent],
  template: '<app-todo></app-todo>',
})
export class TimeTrackingTodoPageComponent {}
