import { Component, OnInit } from '@angular/core';

import { environment } from 'src/environments/environment';

import { SharedModule } from '../legacy/shared.module';

@Component({
  selector: 'app-customer-service',
  templateUrl: './customer-service.component.html',
  styleUrls: ['./customer-service.component.scss'],
  imports: [SharedModule],
  standalone: true,
})
export class CustomerServiceComponent implements OnInit {
  role: string = localStorage.getItem('role') || '';
  roleName?: string;
  lang = 'english';
  url!: string;
  assetsPath: string = environment.assets + '/resources/customerservice.png';

  ngOnInit() {
    this.getRoleName();
    if (this.role == '2')
      this.url = `${environment.form}/efpQc3zkbg?origin=lprLink`;
    else this.url = `${environment.form}/4jCN9nLgYM`;
  }

  getRoleName() {
    switch (this.role) {
      case '1':
        this.roleName = 'admin';
        break;
      case '2':
        this.roleName = 'tm';
        break;
      case '3':
        this.roleName = 'client';
        break;

      default:
        break;
    }
  }

  handleLangChange(event: any) {
    this.lang = event.target.value;
  }
}
