import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedModule } from '../shared.module';
import { TimerComponent } from '../timer/timer.component';
import { UserOptionsComponent } from '../user-options/user-options.component';
import { CompaniesService } from 'src/app/services/companies.service';
import { RouterLink } from '@angular/router';

export interface Link {
  url: string;
  title: string;
}
@Component({
  selector: 'app-company-employees',
  standalone: true,
  imports: [SharedModule, TimerComponent, UserOptionsComponent, RouterLink],
  templateUrl: './company-employees-list.component.html',
  styleUrl: './company-employees-list.component.scss',
})
export class CompanyEmployeesListComponent {
  role = localStorage.getItem('role');
  @Input() employeesByPosition!: any;
  @Input() selectedCompany!: any;
  @Input() timer: boolean = false;
  @Input() loaded!: boolean;
  @Input() links: Link[] = [];
  @Output() onSelectEmployee: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private companiesService: CompaniesService
  ) {}

  setReportInfo(company: any) {
    this.companiesService.setCompanyInformation(company);
  }

  selectEmployee(company: any) {
    this.onSelectEmployee.emit(company);
  }
}
