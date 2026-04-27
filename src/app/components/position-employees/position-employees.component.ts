import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SharedModule } from '../legacy/shared.module';
import { TimerComponent } from '../timer/timer.component';
import { UserOptionsComponent } from '../user-options/user-options.component';

export interface Link {
  url: string;
  title: string;
}
@Component({
  selector: 'app-position-employees',
  standalone: true,
  imports: [SharedModule, TimerComponent, UserOptionsComponent, RouterLink],
  templateUrl: './position-employees.component.html',
  styleUrl: './position-employees.component.scss',
})
export class PositionEmployeesComponent {
  @Input() selectedPosition!: any;

  constructor() {}
}
