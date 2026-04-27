import { Component, ViewChild } from '@angular/core';

import { TablerIconsModule } from 'angular-tabler-icons';

import { MaterialModule } from '../../../legacy/material.module';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule],
  templateUrl: './blog-card.component.html',
})
export class AppBlogCardComponent {
  constructor() {}
}
