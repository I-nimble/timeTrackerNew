import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CompaniesService } from 'src/app/services/companies.service';

import { SharedModule } from '../legacy/shared.module';
import { TimerComponent } from '../timer/timer.component';
import { UserOptionsComponent } from '../user-options/user-options.component';

export interface Link {
  url: string;
  title: string;
}
@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [SharedModule, TimerComponent, UserOptionsComponent, RouterLink],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent {
  role = localStorage.getItem('role');
  @Input() companies!: any;
  @Input() timer = false;
  @Input() loaded!: boolean;
  @Input() links: Link[] = [];
  @Output() onSelectedCompany: EventEmitter<any> = new EventEmitter<any>();

  constructor(private companiesService: CompaniesService) {}

  setReportInfo(company: any) {
    this.companiesService.setCompanyInformation(company);
  }

  selectCompany(company: any) {
    this.onSelectedCompany.emit(company);
  }
}
