import { Component, Input, Output, OnChanges, EventEmitter, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule, Router } from '@angular/router';
import { UsersService } from 'src/app/services/users.service';

interface Department {
  id: number;
  name: string;
}

@Component({
  selector: 'app-client-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule
  ],
  templateUrl: './client-table.component.html',
})
export class ClientTableComponent implements OnChanges, AfterViewInit {
  @Input() clients: any[] = [];
  @Output() selectClient = new EventEmitter<any>();
  displayedColumns: string[] = ['name', 'email', 'phone', 'company', 'departments'];
  dataSourceTable = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private router: Router, private usersService: UsersService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clients']) {
      this.clients.forEach(client => {
        const d = client.company?.departments as Department[] | undefined;
        client.company = client.company || {};
        client.company.departmentsString = d?.map(x => x.name).join(', ') || '';
      });
      this.dataSourceTable = new MatTableDataSource(this.clients);
      if (this.paginator) this.dataSourceTable.paginator = this.paginator;
    }
  }

  ngAfterViewInit() {
    this.dataSourceTable.paginator = this.paginator;
  }

  viewClient(client: any) {
    this.usersService.setUserInformation(client);
    this.router.navigate(['/apps/expert/client', client.id]);
  }
}