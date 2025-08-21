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

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.usersService.getUsers({}).subscribe((users) => {
      this.clients = users.filter((u: any) => u.role == 3 && u.active == 1);
      this.filteredClients = [...this.clients];
    });
  }

  applyDepartmentFilter() {
    const filter = this.departmentFilter.trim().toLowerCase();
    if (!filter) {
      this.filteredClients = [...this.clients];
      return;
    }
    this.filteredClients = this.clients.filter(client => {
      const departments = client.company?.departmentsString?.toLowerCase() || '';
      return departments.includes(filter);
    });
  }
}