import { Component, OnInit } from '@angular/core';
import { UsersService } from 'src/app/services/users.service';
import { environment } from 'src/environments/environment';
import { EmployeesService } from 'src/app/services/employees.service';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class EmployeesComponent implements OnInit {
  employees: any = [];
  assetsPath: string = environment.assets;
  
  constructor(private userService: UsersService, private employeesService: EmployeesService) {}

  ngOnInit(): void {
    this.getEmployees();
  }
  getEmployees() {
    this.employeesService.get().subscribe({
      next: (employees: any) => {
        this.employees = employees.filter((user: any) => user.user.active == 1);
      },
    });
  }
  onSelectUser(data: any) {
    this.userService.setUserInformation(data);
  }
  resetUser() {
    this.userService.resetUser();
  }
}
