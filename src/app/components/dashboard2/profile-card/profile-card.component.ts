import { Component } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from '../../../legacy/material.module';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, MatProgressBarModule],
  templateUrl: './profile-card.component.html',
})
export class AppProfileCardComponent {}
