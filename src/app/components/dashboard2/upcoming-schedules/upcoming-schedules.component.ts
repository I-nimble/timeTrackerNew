import { Component } from '@angular/core';

import { TablerIconsModule } from 'angular-tabler-icons';
import { NgScrollbarModule } from 'ngx-scrollbar';

import { MaterialModule } from '../../../legacy/material.module';

@Component({
  selector: 'app-upcoming-schedules',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, NgScrollbarModule],
  templateUrl: './upcoming-schedules.component.html',
})
export class AppUpcomingSchedulesComponent {
  constructor() {}
}
