import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomDatePipe } from '../services/custom-date.pipe';

import { ClientSidebarComponent } from './navigation-client-sidebar/navigation-client-sidebar/navigation-client-sidebar.component';
import { CalendarComponent } from './calendar/calendar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
// import { EntriesPanelComponent } from './entries-panel/entries-panel.component';
import { EmployeesComponent } from './employees/employees.component';
import { LoaderComponent } from './loader/loader.component';
import { CompaniesService } from '../services/companies.service';
import { GoBackComponent } from './go-back/go-back.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    NgxMaterialTimepickerModule,
    ClientSidebarComponent,
    LoaderComponent,
  ],
  declarations: [
    CalendarComponent,
    CustomDatePipe,
    // EntriesPanelComponent,
    EmployeesComponent,
    GoBackComponent,
  ],
  exports: [
    CalendarComponent,
    FormsModule,
    CustomDatePipe,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    EmployeesComponent,
    MatCardModule,
    GoBackComponent,
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatAutocompleteModule,
    NgxMaterialTimepickerModule,
    MatGridListModule,
    ClientSidebarComponent,
    LoaderComponent,
  ],
  providers: [CustomDatePipe, CalendarComponent, CompaniesService],
})
export class SharedModule {}
