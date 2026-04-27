import { Component } from '@angular/core';

import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/legacy/material.module';
import { AppListingComponent } from 'src/app/pages/apps/contact-list/listing/listing.component';

@Component({
  selector: 'app-contact-list',
  imports: [AppListingComponent, TablerIconsModule, MaterialModule],
  templateUrl: './contact-list.component.html',
})
export class AppContactListComponent {}
