import { Component, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
    MatInputModule
  ],
  templateUrl: './client-table.component.html',
})
export class ClientTableComponent implements OnChanges, AfterViewInit {
  @Input() clients: any[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'company', 'departments'];
  dataSourceTable = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clients']) {
      this.clients.forEach(client => {
        if (client.company && client.company.departments) {
          client.company.departmentsString = (client.company.departments as Department[])
            .map((d: Department) => d.name)
            .join(', ');
        } else if (client.company) {
          client.company.departmentsString = '';
        }
      });

      this.dataSourceTable = new MatTableDataSource(this.clients);
      if (this.paginator) {
        this.dataSourceTable.paginator = this.paginator;
      }
    }
  }

  ngAfterViewInit() {
    this.dataSourceTable.paginator = this.paginator;
  }
}