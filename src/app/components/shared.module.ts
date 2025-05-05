import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomDatePipe } from '../services/custom-date.pipe';

import { NavigationComponent } from './navigation/navigation.component';
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
import { EntriesPanelComponent } from './entries-panel/entries-panel.component';
import { BillsComponent } from './bills/bills.component';
import { StripeComponent } from './stripe/stripe.component';
import { EmployeesComponent } from './employees/employees.component';
import { LoaderComponent } from './loader/loader.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';
import { BalanceComponent } from './balance/balance.component';
import { CompaniesService } from '../services/companies.service';
// import { UserFormComponent } from './user-form/user-form.component';
import { GoBackComponent } from './go-back/go-back.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { ToDoFormComponent } from './to-do-form/to-do-form.component';

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
    AsyncPipe,
    NgxMaterialTimepickerModule,
    ToDoFormComponent,
    NavigationComponent,
    ClientSidebarComponent,
    LoaderComponent,
  ],
  declarations: [
    CalendarComponent,
    CustomDatePipe,
    EntriesPanelComponent,
    BillsComponent,
    StripeComponent,
    EmployeesComponent,
    PaymentHistoryComponent,
    BalanceComponent,
    GoBackComponent,
    // NotificationsComponent,
    // UserListComponent,
  ],
  exports: [
    EntriesPanelComponent,
    NavigationComponent,
    ClientSidebarComponent,
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
    LoaderComponent,
    BalanceComponent,
    GoBackComponent,
    CommonModule,
    // UserComponent,
    // NotificationsComponent,
    RouterModule,
    MatDialogModule,
    MatAutocompleteModule,
    AsyncPipe,
    NgxMaterialTimepickerModule,
    MatGridListModule,
    ToDoFormComponent,
  ],
  providers: [CustomDatePipe, CalendarComponent, CompaniesService],
})
export class SharedModule {}