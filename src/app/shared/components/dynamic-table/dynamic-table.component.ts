import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MaterialModule } from 'src/app/material.module';
import { DynamicPaginatorComponent } from '../dynamic-paginator/dynamic-paginator.component';
import { DynamicTableCellComponent } from './dynamic-table-cell.component';
import {
  DynamicSortOrder,
  DynamicTableCellContext,
  DynamicTableColumn,
  DynamicTableMode,
  DynamicTablePageChange,
  DynamicTableRowActionEvent,
  DynamicTableSortChange,
} from '../../models/dynamic-table.model';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule, MaterialModule, DynamicPaginatorComponent, DynamicTableCellComponent],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicTableComponent<T> implements OnChanges {
  @Input() columns: DynamicTableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data available.';
  @Input() backendMessage = '';
  @Input() emptyIcon = 'inbox';
  @Input() pageSize = 10;
  @Input() paginationMode: DynamicTableMode = 'local';
  @Input() sortingMode: DynamicTableMode = 'local';
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() sortBy = '';
  @Input() sortOrder: DynamicSortOrder = 'asc';
  @Input() rowClickable = false;
  @Output() sortChange = new EventEmitter<DynamicTableSortChange>();
  @Output() pageChange = new EventEmitter<DynamicTablePageChange>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() rowAction = new EventEmitter<DynamicTableRowActionEvent<T>>();

  displayedColumns: string[] = [];
  visibleRows: T[] = [];

  private activeSortBy = '';
  private activeSortOrder: DynamicSortOrder = 'asc';
  private localCurrentPage = 1;
  private remoteCurrentPage = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.displayedColumns = this.columns.map((column) => column.id);
    }

    if (changes['sortBy']) {
      this.activeSortBy = this.sortBy;
    }

    if (changes['sortOrder']) {
      this.activeSortOrder = this.sortOrder;
    }

    if (changes['currentPage']) {
      this.remoteCurrentPage = this.currentPage;
    }

    this.rebuildVisibleRows();
  }

  get effectiveCurrentPage(): number {
    return this.paginationMode === 'remote'
      ? this.remoteCurrentPage
      : this.localCurrentPage;
  }

  get effectiveTotalPages(): number {
    if (this.paginationMode === 'remote') {
      return Math.max(this.totalPages, 1);
    }

    return Math.max(Math.ceil(this.rows.length / this.pageSize), 1);
  }

  get showPaginator(): boolean {
    return this.effectiveTotalPages > 1;
  }

  get activeMatSortBy(): string {
    return this.activeSortBy;
  }

  get activeMatSortDirection(): 'asc' | 'desc' {
    return this.activeSortOrder === 'desc' ? 'desc' : 'asc';
  }

  onMatSortChange(sort: Sort): void {
    if (!sort.active) {
      return;
    }

    this.activeSortBy = sort.active;
    this.activeSortOrder = sort.direction === 'desc' ? 'desc' : 'asc';

    if (this.sortingMode === 'remote') {
      this.remoteCurrentPage = 1;
      this.sortChange.emit({
        sortBy: this.activeSortBy,
        sortOrder: this.activeSortOrder,
        page: 1,
        pageSize: this.pageSize,
      });
      return;
    }

    this.localCurrentPage = 1;
    this.rebuildVisibleRows();
  }

  handlePageChange(page: number): void {
    if (this.paginationMode === 'remote') {
      this.remoteCurrentPage = page;
      this.pageChange.emit({
        page,
        pageSize: this.pageSize,
        sortBy: this.activeSortBy || undefined,
        sortOrder: this.activeSortBy ? this.activeSortOrder : undefined,
      });
      return;
    }

    this.localCurrentPage = page;
    this.rebuildVisibleRows();
  }

  onRowClicked(row: T): void {
    if (!this.rowClickable) {
      return;
    }

    this.rowClick.emit(row);
  }

  getCellValue(row: T, column: DynamicTableColumn<T>): unknown {
    const { accessor } = column;

    if (!accessor) {
      return (row as Record<string, unknown>)[column.id];
    }

    if (typeof accessor === 'function') {
      return accessor(row);
    }

    return this.resolvePathValue(row as Record<string, unknown>, accessor as string);
  }

  getCellText(row: T, column: DynamicTableColumn<T>): string {
    const value = this.getCellValue(row, column);

    if (value === null || value === undefined || value === '') {
      return column.emptyValue ?? 'N/A';
    }

    return String(value);
  }

  getCellContext(row: T, column: DynamicTableColumn<T>, index: number): DynamicTableCellContext<T> {
    return {
      $implicit: row,
      row,
      value: this.getCellValue(row, column),
      column,
      index,
    };
  }

  private rebuildVisibleRows(): void {
    const rows = this.sortingMode === 'local' ? this.getSortedRows() : [...this.rows];

    if (this.paginationMode === 'remote') {
      this.visibleRows = rows;
      return;
    }

    const clampedPage = Math.min(this.localCurrentPage, this.effectiveTotalPages);
    this.localCurrentPage = Math.max(clampedPage, 1);
    const startIndex = (this.localCurrentPage - 1) * this.pageSize;
    this.visibleRows = rows.slice(startIndex, startIndex + this.pageSize);
  }

  private getSortedRows(): T[] {
    if (!this.activeSortBy) {
      return [...this.rows];
    }

    const column = this.columns.find(
      (item) => (item.sortKey || item.id) === this.activeSortBy,
    );

    if (!column) {
      return [...this.rows];
    }

    const direction = this.activeSortOrder === 'asc' ? 1 : -1;

    return [...this.rows].sort((leftRow, rightRow) => {
      const left = this.normalizeSortValue(this.getCellValue(leftRow, column));
      const right = this.normalizeSortValue(this.getCellValue(rightRow, column));

      if (left === right) {
        return 0;
      }

      if (left === null) {
        return 1;
      }

      if (right === null) {
        return -1;
      }

      return left > right ? direction : -direction;
    });
  }

  private normalizeSortValue(value: unknown): string | number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'number') {
      return value;
    }

    const dateValue = Date.parse(String(value));
    if (!Number.isNaN(dateValue) && String(value).includes('-')) {
      return dateValue;
    }

    return String(value).toLowerCase();
  }

  private resolvePathValue(row: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((value, part) => {
      if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
        return (value as Record<string, unknown>)[part];
      }

      return undefined;
    }, row);
  }
}
