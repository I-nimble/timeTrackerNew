import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { Positions } from 'src/app/models/Position.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { FormatNamePipe } from 'src/app/pipe/format-name.pipe';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-talent-match-table',
  templateUrl: './talent-match-table.component.html',
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    FormatNamePipe,
    MatSortModule
  ]
})
export class TalentMatchTableComponent {
  @Input() dataSource: any;
  @Input() positions: Positions[] = [];
  @Input() displayedColumns: string[] = [];
  @Input() totalRecords = 0;
  @Input() pageSize = 10;
  @Input() pageSizeOptions = [5, 10, 25];
  @Input() loading: boolean = false;
  @Input() sortBy: string | null = null;
  @Input() sortOrder: 'asc' | 'desc' | null = null;
  @Output() pageChange = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<any>();
  assetsPath: string = 'assets/images/default-user-profile-pic.png';

  onSortChange(event: any) {
    this.sortChange.emit(event);
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.assetsPath;
    imgElement.onerror = null;
  }
}