import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string, options: MatSnackBarConfig = {}): void {
    this.show('success', message, options);
  }

  error(message: string, options: MatSnackBarConfig = {}): void {
    this.show('error', message, options);
  }

  warning(message: string, options: MatSnackBarConfig = {}): void {
    this.show('warning', message, options);
  }

  info(message: string, options: MatSnackBarConfig = {}): void {
    this.show('info', message, options);
  }

  dismissAll(): void {
    this.snackBar.dismiss();
  }

  private show(
    type: NotificationType,
    message: string,
    options: MatSnackBarConfig,
  ): void {
    const {
      panelClass,
      duration = 6000,
      horizontalPosition = 'center',
      verticalPosition = 'top',
      ...config
    } = options;
    const typeClass = `app-snackbar-${type}`;
    const mergedPanelClass = panelClass
      ? Array.isArray(panelClass)
        ? [...panelClass, typeClass]
        : [panelClass, typeClass]
      : [typeClass];

    this.snackBar.open(message, 'Close', {
      ...config,
      duration,
      horizontalPosition,
      verticalPosition,
      panelClass: mergedPanelClass,
    });
  }
}
