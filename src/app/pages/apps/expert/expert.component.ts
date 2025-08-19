import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';   // <- bundles MatCard, MatFormField, MatIcon, etc.
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
  searchText: string = '';

  constructor(private usersService: UsersService) {}

  ngOnInit(): void {
    this.usersService.getUsers({}).subscribe((users) => {
      this.clients = users.filter((u: any) => u.role == 3 && u.active == 1);
    });
  }

  applyCombinedFilters() {
    console.log('Search text:', this.searchText);
  }
}