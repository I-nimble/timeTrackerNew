import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { RatingsService } from 'src/app/services/ratings.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { EmployeesService } from 'src/app/services/employees.service';
import { UsersService } from 'src/app/services/users.service';
import { ModalComponent } from 'src/app/components/confirmation-modal/modal.component';

@Component({
    selector: 'app-kanban-dialog',
    templateUrl: './kanban-dialog.component.html',
    standalone: true,
    imports: [
        MaterialModule,
        CommonModule,
        TablerIconsModule,
        FormsModule,
        ReactiveFormsModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    providers: [DatePipe, provideNativeDateAdapter()]
})
export class AppKanbanDialogComponent {
  action: string;
  local_data: any;
  priorities: any[] = [];
  visibilities = ['public', 'restricted', 'private'];
  users: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<AppKanbanDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    private datePipe: DatePipe,
    public ratingsService: RatingsService,
    private companiesService: CompaniesService,
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private dialog: MatDialog
  ) {
    this.getPriorities();
    this.local_data = { ...data };
    this.action = this.local_data.action;
    
    if (data.type === 'board') {
      this.local_data.type = 'board';
      this.local_data.id = data.id || null;
      this.local_data.goal = data.name || '';
      this.local_data.previousVisibility = data.visibility || 'public';
      this.local_data.selectedVisibility = data.visibility || 'public';
      this.local_data.restrictedUsers = data.restrictedUsers?.map((u:any) => u.user_id) || [];
      this.getCompany();
    }
    else {
      this.local_data.type = 'task';
      this.local_data.date = this.datePipe.transform(new Date(), 'd MMMM')!;
      this.local_data.taskProperty ||= 'Design';
      this.local_data.imageUrl ||= '/assets/images/taskboard/kanban-img-1.jpg';
      this.getCompany();
    }
  }

  getCompany() {
    if(localStorage.getItem('role') === '3') {
      this.companiesService.getByOwner().subscribe((company: any) => {
        this.getUsers(company.company_id);
      });
    }
    else if (localStorage.getItem('role') === '2') {
      this.employeesService.getByEmployee().subscribe((employee: any) => {
        this.getUsers(employee.company_id);
      });
    }
    else if (localStorage.getItem('role') === '1' && this.local_data.company_id) {
      this.companiesService.getCompanies().subscribe((companies: any) => {
        const company = companies.find((c:any) => c.id === this.local_data.company_id);
        this.getUsers(company.id);
      });
    }
  }

  getUsers(companyId: number) {
    this.companiesService.getEmployees(companyId).subscribe((employees: any) => {
      this.users = this.users.concat(employees.map((e:any) => e.user));
      this.companiesService.getEmployer(companyId).subscribe((employer: any) => {
        this.users.push(employer.user);
        this.users = this.users.sort((a:any, b:any) => a.name.localeCompare(b.name));
      });
    });
  }

  getPriorities() {
    this.ratingsService.getPriorities().subscribe((priorities: any[]) => {
      this.priorities = priorities;
    });
  }

  doAction(): void {
    if (this.action === 'Edit' && this.local_data.previousVisibility === 'private' && this.local_data.selectedVisibility === 'public') {
      const dialogRef = this.dialog.open(ModalComponent, {
        data: {
          action: this.action,
          type: 'board visibility',
          message: 'This will make the board public. Everyone will be able to see it.',
        }
      });

      dialogRef.afterClosed().subscribe((result:any) => {
        if (!result) return;
        if(result) {
          this.dialogRef.close({ event: this.action, data: this.local_data });
        }
      });
    }
    else {
      this.dialogRef.close({ event: this.action, data: this.local_data });
    }
  }

  closeDialog(): void {
    this.dialogRef.close({ event: 'Cancel' });
  }

  handleVisibilityChange(event: any) {
    this.local_data.selectedVisibility = event.value;
    this.local_data.restrictedUsers = [];
  }
}
