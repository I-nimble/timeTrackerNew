import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { UsersService } from 'src/app/services/users.service';
import { ClientTableComponent } from './client-table/client-table.component';

@Component({
  selector: 'app-expert',
  templateUrl: './expert.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    TablerIconsModule,
    ClientTableComponent,
  ]
})
export class AppExpertComponent implements OnInit {
  clients: any[] = [];
  filteredClients: any[] = [];
  departmentFilter: string = '';
  departments: string[] = [];

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.usersService.getUsers({}).subscribe((users) => {
      this.clients = users.filter((u: any) => u.role == 3 && u.active == 1);
      this.filteredClients = [...this.clients];

      const deptSet = new Set<string>();
      this.clients.forEach(client => {
        client.company?.departments?.forEach((d: any) => deptSet.add(d.name));
      });
      this.departments = Array.from(deptSet).sort();
    });
  }

  applyDepartmentFilter() {
    if (!this.departmentFilter) {
      this.filteredClients = [...this.clients];
      return;
    }

    const filter = this.departmentFilter.toLowerCase();

    this.filteredClients = this.clients.filter(client => {
      const departments = client.company?.departments?.map((d: any) => d.name.toLowerCase()) || [];
      return departments.includes(filter);
    });
  }
}