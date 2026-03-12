import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MaterialModule } from 'src/app/material.module';
import { DynamicPaginatorComponent } from '../dynamic-paginator/dynamic-paginator.component';
import { DynamicTableCellComponent } from './dynamic-table-cell.component';
import { Loader } from 'src/app/app.models';
import { LoaderComponent } from 'src/app/components/loader/loader.component';
import {
  DynamicSortOrder,
  DynamicTableCellContext,
  DynamicTableColumn,
  DynamicTablePageChange,
  DynamicTableRowActionEvent,
  DynamicTableSortChange,
} from '../../models/dynamic-table.model';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule, MaterialModule, DynamicPaginatorComponent, DynamicTableCellComponent, LoaderComponent],
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
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() sortBy = '';
  @Input() sortOrder: DynamicSortOrder = 'asc';
  @Input() rowClickable = false;
  @Input() expandedRow: T | null = null;
  @Input() expandedRowTemplate?: TemplateRef<DynamicTableCellContext<T>>;
  @Output() sortChange = new EventEmitter<DynamicTableSortChange>();
  @Output() pageChange = new EventEmitter<DynamicTablePageChange>();
  @Output() rowClick = new EventEmitter<T>();
  @Output() rowAction = new EventEmitter<DynamicTableRowActionEvent<T>>();

  displayedColumns: string[] = [];
  expansionRowColumns: string[] = ['__expandedDetail'];
  readonly tableLoader = new Loader(true, false, false);

  private activeSortBy = '';
  private activeSortOrder: DynamicSortOrder = 'asc';
  private hasResolvedInitialState = false;
  private readonly expansionColumn: DynamicTableColumn<T> = {
    id: '__expandedDetail',
    header: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.displayedColumns = this.columns.map((column) => column.id);
    }

    if (changes['rows']) {
      const rowsChange = changes['rows'];
      if (this.rows.length > 0 || !rowsChange.firstChange) {
        this.hasResolvedInitialState = true;
      }
    }

    if (changes['loading'] && this.loading === false) {
      this.hasResolvedInitialState = true;
    }

    if (changes['backendMessage'] && this.backendMessage) {
      this.hasResolvedInitialState = true;
    }

    if (changes['sortBy']) {
      this.activeSortBy = this.sortBy;
    }

    if (changes['sortOrder']) {
      this.activeSortOrder = this.sortOrder;
    }
  }

  get paginatorTotalPages(): number {
    return Math.max(this.totalPages, 1);
  }

  get hasExpandedRowTemplate(): boolean {
    return !!this.expandedRowTemplate;
  }

  get showLoader(): boolean {
    return this.loading || !this.hasResolvedInitialState;
  }

  get showPaginator(): boolean {
    return this.paginatorTotalPages > 1;
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
    this.sortChange.emit({
      sortBy: this.activeSortBy,
      sortOrder: this.activeSortOrder,
      page: 1,
      pageSize: this.pageSize,
    });
  }

  handlePageChange(page: number): void {
    this.pageChange.emit({
      page,
      pageSize: this.pageSize,
      sortBy: this.activeSortBy || undefined,
      sortOrder: this.activeSortBy ? this.activeSortOrder : undefined,
    });
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

  isExpandedRow = (_index: number, row: T): boolean => this.hasExpandedRow(row);

  getExpandedRowContext(row: T, index: number): DynamicTableCellContext<T> {
    return {
      $implicit: row,
      row,
      value: row,
      column: this.expansionColumn,
      index,
    };
  }

  hasExpandedRow(row: T): boolean {
    return !!this.expandedRowTemplate && this.expandedRow === row;
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
