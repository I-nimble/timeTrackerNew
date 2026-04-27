import { Component } from '@angular/core';

import { EmployeeDetailsComponent } from 'src/app/pages/apps/employee/employee-details/employee-details.component';

@Component({
  selector: 'app-workforce-employee-details-page',
  standalone: true,
  imports: [EmployeeDetailsComponent],
  template: '<app-employee-details></app-employee-details>',
})
export class WorkforceEmployeeDetailsPageComponent {}
