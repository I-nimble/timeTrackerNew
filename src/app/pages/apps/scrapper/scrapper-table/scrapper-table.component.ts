import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-scrapper-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatIconModule],
  templateUrl: './scrapper-table.component.html',
})
export class ScrapperTableComponent implements OnChanges, AfterViewInit {
  @Input() items: any[] = [];
  displayedColumns: string[] = [
    'title',
    'url',
    'keyword',
    'author',
    'created_utc',
    'suggestion',
  ];
  dataSourceTable = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.items) {
      this.dataSourceTable.data = this.items;
    }
  }

  ngAfterViewInit() {
    this.dataSourceTable.paginator = this.paginator;
  }
}
