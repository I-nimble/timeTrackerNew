import { TemplateRef } from '@angular/core';

export type DynamicSortOrder = 'asc' | 'desc';
export type DynamicTableMode = 'local' | 'remote';
export type DynamicValueAccessor<T, TValue = unknown> =
  | keyof T
  | string
  | ((row: T) => TValue);

export interface DynamicTableBadgeConfig<T> {
  accessor: DynamicValueAccessor<T, unknown[]>;
  labelAccessor?: string | ((badge: any) => string);
  colorAccessor?: string | ((badge: any) => string | null | undefined);
}

export interface DynamicTableActionItem<T> {
  id: string;
  label: string;
  icon?: string;
  visible?: boolean | ((row: T) => boolean);
  disabled?: boolean | ((row: T) => boolean);
}

export interface DynamicTableRowActionEvent<T> {
  action: DynamicTableActionItem<T>;
  row: T;
}

export interface DynamicTableAvatarNameRenderer<T> {
  type: 'avatar-name';
  imageAccessor: DynamicValueAccessor<T>;
  titleAccessor: DynamicValueAccessor<T>;
  subtitleAccessor?: DynamicValueAccessor<T>;
  badges?: DynamicTableBadgeConfig<T>;
  imageFallback?: string;
  titleTransform?: (value: unknown, row: T) => string;
  subtitleTransform?: (value: unknown, row: T) => string;
}

export interface DynamicTableTextBadgesRenderer<T> {
  type: 'text-badges';
  textAccessor: DynamicValueAccessor<T>;
  badges?: DynamicTableBadgeConfig<T>;
  textTransform?: (value: unknown, row: T) => string;
}

export interface DynamicTableMetricRenderer<T> {
  type: 'metric';
  primaryAccessor: DynamicValueAccessor<T>;
  secondaryAccessor?: DynamicValueAccessor<T>;
  primarySuffix?: string;
  primaryTransform?: (value: unknown, row: T) => string;
  secondaryTransform?: (value: unknown, row: T) => string;
}

export interface DynamicTableTruncatedTextRenderer<T> {
  type: 'truncated-text';
  textAccessor: DynamicValueAccessor<T>;
  fallbackAccessor?: DynamicValueAccessor<T>;
  maxLength?: number;
}

export interface DynamicTableStatusPillRenderer<T> {
  type: 'status-pill';
  valueAccessor?: DynamicValueAccessor<T>;
  palettes: Record<string, { backgroundColor: string; color?: string }>;
  defaultPalette?: { backgroundColor: string; color?: string };
  valueTransform?: (value: unknown, row: T) => string;
}

export interface DynamicTableDateRenderer<T> {
  type: 'date';
  valueAccessor?: DynamicValueAccessor<T>;
  format?: string;
  fallbackText?: string;
}

export interface DynamicTableActionsRenderer<T> {
  type: 'actions';
  items: DynamicTableActionItem<T>[];
  triggerIcon?: string;
}

export type DynamicTableRenderer<T> =
  | DynamicTableAvatarNameRenderer<T>
  | DynamicTableTextBadgesRenderer<T>
  | DynamicTableMetricRenderer<T>
  | DynamicTableTruncatedTextRenderer<T>
  | DynamicTableStatusPillRenderer<T>
  | DynamicTableDateRenderer<T>
  | DynamicTableActionsRenderer<T>;

export interface DynamicTableCellContext<T> {
  $implicit: T;
  row: T;
  value: unknown;
  column: DynamicTableColumn<T>;
  index: number;
}

export interface DynamicTableHeaderContext<T> {
  column: DynamicTableColumn<T>;
}

export interface DynamicTableColumn<T> {
  id: string;
  header: string;
  accessor?: DynamicValueAccessor<T>;
  sortable?: boolean;
  sortKey?: string;
  headerClass?: string;
  cellClass?: string;
  renderer?: DynamicTableRenderer<T>;
  cellTemplate?: TemplateRef<DynamicTableCellContext<T>>;
  headerTemplate?: TemplateRef<DynamicTableHeaderContext<T>>;
  emptyValue?: string;
}

export interface DynamicTableSortChange {
  sortBy: string;
  sortOrder: DynamicSortOrder;
  page: number;
  pageSize: number;
}

export interface DynamicTablePageChange {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: DynamicSortOrder;
}
