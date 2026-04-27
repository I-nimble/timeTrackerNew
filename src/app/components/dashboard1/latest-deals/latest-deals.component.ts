import { Component, ViewChild } from '@angular/core';

import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from '../../../legacy/material.module';

@Component({
  selector: 'app-latest-deals',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule],
  templateUrl: './latest-deals.component.html',
})
export class AppLatestDealsComponent {
  constructor() {}
}
