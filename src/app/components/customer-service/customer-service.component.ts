import { Component } from '@angular/core';
import { SharedModule } from '../shared.module';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-customer-service',
  templateUrl: './customer-service.component.html',
  styleUrls: ['./customer-service.component.scss'],
  imports: [SharedModule],
  standalone: true
})
export class CustomerServiceComponent {
  role: string = localStorage.getItem('role') || '';
  roleName?: string
  lang: string = "english"
  url!: string;
  assetsPath: string = environment.assets + '/resources/customerservice.png';

  ngOnInit() {
    this.getRoleName()
    if (this.role == '2')
      this.url = `${environment.form}/efpQc3zkbg?origin=lprLink`;
    else this.url = `${environment.form}/4jCN9nLgYM`;
  }

  getRoleName() {
    switch (this.role) {
      case '1':
        this.roleName = 'admin'
        break;
      case '2':
        this.roleName = 'tm'
        break;
      case '3':
        this.roleName = 'client'
        break;
    
      default:
        break;
    }
  }

  handleLangChange(event:any) {
    this.lang = event.target.value
  }
}
