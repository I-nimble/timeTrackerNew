import {
  Component,
  ViewChild,
  OnInit
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { EmployeesService } from 'src/app/services/employees.service';
import { UsersService } from 'src/app/services/users.service';
import { CompaniesService } from 'src/app/services/companies.service';
import { SchedulesService } from 'src/app/services/schedules.service';
import { Employee } from 'src/app/pages/apps/employee/employee';
import { AppEmployeeTableComponent } from '../employee/employee-table/employee-table.component';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { TablerIconsModule } from 'angular-tabler-icons';
import { EmployeeDetailsComponent } from '../employee/employee-details/employee-details.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, MaterialModule, AppEmployeeTableComponent, TablerIconsModule, EmployeeDetailsComponent],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  dataSource = new MatTableDataSource<Employee>([]);
  loaded = false;
  userRole = localStorage.getItem('role');
  companies: any[] = [];
  companyId: number | null = null;

  constructor(
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private schedulesService: SchedulesService
  ) {}

  ngOnInit(): void {
    this.getEmployees();
  }

  getEmployees() {
    this.employeesService.get().subscribe({
      next: (employees: any) => {
        let users = employees.filter((user: any) => user.user.active == 1 && user.user.role == 2);
        this.schedulesService.get().subscribe({
          next: (schedules: any) => {
            schedules = schedules.schedules;
            users = users.map((user: any) => {
              const userSchedules = schedules.find((schedule: any) => schedule.employee_id === user.id);
              let scheduleString = 'No registered schedule';
              if (userSchedules) {
                const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const workingDays = userSchedules.days
                  .map((day: any) => day.name)
                  .sort((a: string, b: string) => weekDays.indexOf(a) - weekDays.indexOf(b));
                scheduleString = this.formatDaysRange(workingDays);
              }
              return {
                id: user.user.id,
                company_id: user.company_id,
                name: user.user.name,
                last_name: user.user.last_name,
                email: user.user.email,
                position: user.position_id,
                projects: user.projects.map((project: any) => project.id),
                schedule: scheduleString,
                Salary: 0,
                imagePath: 'assets/images/default-profile-pic.png',
              };
            });
            this.dataSource.data = users;
            this.loaded = true;
          },
          error: (err) => {
            console.error('Error fetching schedules:', err);
          },
        });
      },
      error: (err) => {
        console.error('Error fetching employees:', err);
      },
    });
  }

  formatDaysRange(days: string[]): string {
    const weekDays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];
    const indices = days.map(day => weekDays.indexOf(day)).filter(i => i !== -1).sort((a, b) => a - b);
    if (indices.length === 0) return '';
    let isConsecutive = true;
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive && indices.length > 1) {
      return `${weekDays[indices[0]]} to ${weekDays[indices[indices.length - 1]]}`;
    } else {
      return days.join(', ');
    }
  }

  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  handleCompanySelection(event: any) {
    this.companyId = event.value;
    this.dataSource.data = this.dataSource.data.filter((user: any) => user.company_id === this.companyId);
  }

  openDialog(action: string, employee: any): void {
    // Placeholder: implement dialog logic if needed
    alert(`${action} dialog for employee: ${employee?.name || ''}`);
  }
}
