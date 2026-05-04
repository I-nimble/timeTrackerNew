import { Component } from '@angular/core';

import { TablerIconsModule } from 'angular-tabler-icons';
import { AppListingComponent } from 'src/app/legacy/pages/apps/contact-list/listing/listing.component';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-contact-list',
  imports: [AppListingComponent, TablerIconsModule, MaterialModule],
  templateUrl: './contact-list.component.html',
})
export class AppContactListComponent {}
