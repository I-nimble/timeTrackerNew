import { AsyncPipe, CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';

import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

import { CompaniesService } from '../../services/companies.service';
import { CustomDatePipe } from '../../services/custom-date.pipe';
import { BalanceComponent } from '../balance/balance.component';
import { BillsComponent } from '../bills/bills.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { EmployeesComponent } from '../employees/employees.component';
import { GoBackComponent } from '../go-back/go-back.component';
import { LoaderComponent } from '../loader/loader.component';
import { NavigationComponent } from '../navigation/navigation.component';
import { ClientSidebarComponent } from '../navigation-client-sidebar/navigation-client-sidebar/navigation-client-sidebar.component';
import { PaymentHistoryComponent } from '../payment-history/payment-history.component';
import { StripeComponent } from '../stripe/stripe.component';
import { ToDoFormComponent } from '../to-do-form/to-do-form.component';

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
    ToDoFormComponent,
    NavigationComponent,
    ClientSidebarComponent,
    LoaderComponent,
  ],
  declarations: [
    CalendarComponent,
    CustomDatePipe,
    // EntriesPanelComponent,
    BillsComponent,
    StripeComponent,
    EmployeesComponent,
    PaymentHistoryComponent,
    BalanceComponent,
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
    StripeComponent,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    EmployeesComponent,
    MatCardModule,
    BillsComponent,
    PaymentHistoryComponent,
    BalanceComponent,
    GoBackComponent,
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatAutocompleteModule,
    NgxMaterialTimepickerModule,
    MatGridListModule,
    ToDoFormComponent,
    NavigationComponent,
    ClientSidebarComponent,
    LoaderComponent,
  ],
  providers: [CustomDatePipe, CalendarComponent, CompaniesService],
})
export class SharedModule {}
