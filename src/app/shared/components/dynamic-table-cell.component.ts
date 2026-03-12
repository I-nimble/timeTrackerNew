import { CommonModule, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { MatSortModule } from '@angular/material/sort';
import {
  DynamicTableActionItem,
  DynamicTableBadgeConfig,
  DynamicTableColumn,
  DynamicTableRenderer,
  DynamicTableRowActionEvent,
  DynamicValueAccessor,
} from '../../models/dynamic-table.model';

@Component({
  selector: 'app-dynamic-table-cell',
  standalone: true,
  imports: [CommonModule, MaterialModule, MatSortModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dynamic-table-cell.component.html',
  styleUrls: ['./dynamic-table-cell.component.scss'],
})
export class DynamicTableCellComponent<T> {
  @Input({ required: true }) row!: T;
  @Input({ required: true }) column!: DynamicTableColumn<T>;
  @Output() rowAction = new EventEmitter<DynamicTableRowActionEvent<T>>();

  getRendererType(): DynamicTableRenderer<T>['type'] | null {
    return this.column.renderer?.type ?? null;
  }

  getFallbackText(): string {
    const value = this.getCellValue(this.column.accessor);
    if (value === null || value === undefined || value === '') {
      return this.column.emptyValue ?? 'N/A';
    }

    return String(value);
  }

  getAvatarTitle(): string {
    const renderer = this.getRenderer('avatar-name');
    if (!renderer) {
      return this.getFallbackText();
    }

    return this.formatRendererValue(
      renderer.titleAccessor,
      renderer.titleTransform,
      this.column.emptyValue ?? 'N/A',
    );
  }

  getAvatarSubtitle(): string {
    const renderer = this.getRenderer('avatar-name');
    if (!renderer?.subtitleAccessor) {
      return '';
    }

    return this.formatRendererValue(renderer.subtitleAccessor, renderer.subtitleTransform, '');
  }

  getAvatarImage(): string {
    const renderer = this.getRenderer('avatar-name');
    if (!renderer) {
      return '';
    }

    const value = this.getCellValue(renderer.imageAccessor, renderer.imageFallback || '');
    return value === null || value === undefined ? '' : String(value);
  }

  getAvatarFallback(): string {
    return this.getRenderer('avatar-name')?.imageFallback || '';
  }

  getTextBadgesText(): string {
    const renderer = this.getRenderer('text-badges');
    if (!renderer) {
      return this.getFallbackText();
    }

    return this.formatRendererValue(
      renderer.textAccessor,
      renderer.textTransform,
      this.column.emptyValue ?? 'N/A',
    );
  }

  getMetricPrimary(): string {
    const renderer = this.getRenderer('metric');
    if (!renderer) {
      return this.getFallbackText();
    }

    const value = this.formatRendererValue(
      renderer.primaryAccessor,
      renderer.primaryTransform,
      this.column.emptyValue ?? 'N/A',
    );

    return `${value}${renderer.primarySuffix || ''}`;
  }

  getMetricSecondary(): string {
    const renderer = this.getRenderer('metric');
    if (!renderer?.secondaryAccessor) {
      return '';
    }

    return this.formatRendererValue(renderer.secondaryAccessor, renderer.secondaryTransform, '');
  }

  getTruncatedText(): string {
    const renderer = this.getRenderer('truncated-text');
    if (!renderer) {
      return this.getFallbackText();
    }

    const primaryText = this.getCellValue(renderer.textAccessor, '');
    const fallbackText = renderer.fallbackAccessor
      ? this.getCellValue(renderer.fallbackAccessor, '')
      : '';
    const resolvedText = String(primaryText || fallbackText || this.column.emptyValue || 'N/A');
    const maxLength = renderer.maxLength || 50;

    return resolvedText.length <= maxLength
      ? resolvedText
      : `${resolvedText.slice(0, maxLength)}...`;
  }

  getStatusLabel(): string {
    const renderer = this.getRenderer('status-pill');
    const rawValue = renderer?.valueAccessor
      ? this.getCellValue(renderer.valueAccessor, this.column.emptyValue ?? 'N/A')
      : this.getCellValue(this.column.accessor, this.column.emptyValue ?? 'N/A');

    if (!renderer) {
      return this.getFallbackText();
    }

    if (renderer.valueTransform) {
      return renderer.valueTransform(rawValue, this.row);
    }

    return rawValue === null || rawValue === undefined || rawValue === ''
      ? this.column.emptyValue ?? 'N/A'
      : String(rawValue);
  }

  getStatusStyles(): Record<string, string> {
    const renderer = this.getRenderer('status-pill');
    if (!renderer) {
      return {};
    }

    const value = this.getStatusLabel().toLowerCase();
    const palette = renderer.palettes[value] || renderer.defaultPalette;
    if (!palette) {
      return {};
    }

    return {
      'background-color': palette.backgroundColor,
      color: palette.color || 'white',
    };
  }

  getFormattedDate(): string {
    const renderer = this.getRenderer('date');
    const value = renderer?.valueAccessor
      ? this.getCellValue(renderer.valueAccessor, null)
      : this.getCellValue(this.column.accessor, null);

    if (!renderer) {
      return this.getFallbackText();
    }

    if (!value) {
      return renderer.fallbackText || this.column.emptyValue || 'N/A';
    }

    if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
      try {
        return formatDate(value, renderer.format || 'mediumDate', 'en-US');
      } catch {
        return String(value);
      }
    }

    return String(value);
  }

  getBadges(): any[] {
    const badgeConfig = this.getBadgeConfig();
    if (!badgeConfig) {
      return [];
    }

    const badges = this.getCellValue(badgeConfig.accessor, []);
    return Array.isArray(badges) ? badges : [];
  }

  getBadgeLabel(badge: any): string {
    const badgeConfig = this.getBadgeConfig();
    if (!badgeConfig) {
      return '';
    }

    if (typeof badgeConfig.labelAccessor === 'function') {
      return badgeConfig.labelAccessor(badge);
    }

    if (typeof badgeConfig.labelAccessor === 'string') {
      return String(this.resolvePathValue(badge, badgeConfig.labelAccessor) || '');
    }

    return typeof badge?.name === 'string' ? badge.name : String(badge || '');
  }

  getBadgeColor(badge: any): string | null {
    const badgeConfig = this.getBadgeConfig();
    if (!badgeConfig?.colorAccessor) {
      return null;
    }

    if (typeof badgeConfig.colorAccessor === 'function') {
      return badgeConfig.colorAccessor(badge) || null;
    }

    return String(this.resolvePathValue(badge, badgeConfig.colorAccessor) || '') || null;
  }

  getVisibleActions(): DynamicTableActionItem<T>[] {
    const renderer = this.getRenderer('actions');
    if (!renderer) {
      return [];
    }

    return renderer.items.filter((action) => this.evaluateActionState(action.visible, true));
  }

  isActionDisabled(action: DynamicTableActionItem<T>): boolean {
    return this.evaluateActionState(action.disabled, false);
  }

  getActionTriggerIcon(): string {
    return this.getRenderer('actions')?.triggerIcon || 'more_vert';
  }

  onActionClick(action: DynamicTableActionItem<T>, event: MouseEvent): void {
    event.stopPropagation();
    this.rowAction.emit({ action, row: this.row });
  }

  onRendererImageError(event: Event, fallback: string): void {
    if (!fallback) {
      return;
    }

    const imageElement = event.target as HTMLImageElement;
    imageElement.src = fallback;
    imageElement.onerror = null;
  }

  private getRenderer<K extends DynamicTableRenderer<T>['type']>(
    type: K,
  ): Extract<DynamicTableRenderer<T>, { type: K }> | null {
    return this.column.renderer?.type === type
      ? (this.column.renderer as Extract<DynamicTableRenderer<T>, { type: K }>)
      : null;
  }

  private getBadgeConfig(): DynamicTableBadgeConfig<T> | undefined {
    const renderer = this.column.renderer;
    if (renderer?.type === 'avatar-name' || renderer?.type === 'text-badges') {
      return renderer.badges;
    }

    return undefined;
  }

  private getCellValue(
    accessor: DynamicValueAccessor<T> | undefined,
    fallback: unknown = undefined,
  ): unknown {
    if (!accessor) {
      return fallback;
    }

    if (typeof accessor === 'function') {
      const value = accessor(this.row);
      return value === null || value === undefined || value === '' ? fallback : value;
    }

    const value = typeof accessor === 'string'
      ? this.resolvePathValue(this.row as Record<string, unknown>, accessor)
      : (this.row as Record<string, unknown>)[String(accessor)];

    return value === null || value === undefined || value === '' ? fallback : value;
  }

  private formatRendererValue(
    accessor: DynamicValueAccessor<T>,
    transform: ((value: unknown, row: T) => string) | undefined,
    fallback: string,
  ): string {
    const value = this.getCellValue(accessor, fallback);
    if (transform) {
      return transform(value, this.row);
    }

    return value === null || value === undefined || value === '' ? fallback : String(value);
  }

  private evaluateActionState(
    predicate: boolean | ((row: T) => boolean) | undefined,
    defaultValue: boolean,
  ): boolean {
    if (typeof predicate === 'function') {
      return predicate(this.row);
    }

    if (typeof predicate === 'boolean') {
      return predicate;
    }

    return defaultValue;
  }

  private resolvePathValue(source: any, path: string): unknown {
    return path.split('.').reduce<unknown>((value, part) => {
      if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
        return (value as Record<string, unknown>)[part];
      }

      return undefined;
    }, source);
  }
}