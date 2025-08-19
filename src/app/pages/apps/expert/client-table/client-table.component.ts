import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
export class ClientTableComponent implements OnChanges {
  @Input() clients: any[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'company'];
  dataSourceTable = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clients']) {
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