import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from '../../../legacy/material.module';

@Component({
  selector: 'app-new-goals',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatProgressBarModule],
  templateUrl: './new-goals.component.html',
})
export class AppNewGoalsComponent {}
